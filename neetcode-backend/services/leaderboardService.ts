import { redisClient } from '../utils/redis';
import { User, Submission, Problem, CommunityMember } from '../models/index';
import { logger } from '../logger/index';

const GLOBAL_LEADERBOARD_KEY = 'leaderboard:global';
const SCORE_KEY_PREFIX = 'user:score:';

// Points are strictly awarded for DSA problems
const SCORE_VALUES = {
  easy: 20,
  medium: 30,
  hard: 50,
};

export class LeaderboardService {
  /**
   * Initializes Redis keys for a new user if they don't exist.
   */
  public async initializeUser(userId: string): Promise<void> {
    const exists = await redisClient.zScore(GLOBAL_LEADERBOARD_KEY, userId);
    if (exists === null) {
      await redisClient.zAdd(GLOBAL_LEADERBOARD_KEY, 0, userId);
      await redisClient.set(`${SCORE_KEY_PREFIX}${userId}:solved`, '0');
      await redisClient.set(`${SCORE_KEY_PREFIX}${userId}:lastSolved`, '0');
    }
  }

  public async getUserSolvedCount(userId: string): Promise<number> {
    const solved = await redisClient.get(`${SCORE_KEY_PREFIX}${userId}:solved`);
    return Number(solved || 0);
  }

  /**
   * Syncs a user's existing global score to a specific community set when they join.
   */
  public async addUserToCommunityLeaderboard(userId: string, communityId: string): Promise<void> {
    const score = await this.getUserScore(userId);
    const communityKey = `leaderboard:community:${communityId}`;
    await redisClient.zAdd(communityKey, score, userId);
  }

  public async getMyRankInCommunity(userId: string, communityId: string): Promise<number> {
    const communityKey = `leaderboard:community:${communityId}`;
    const rank = await redisClient.zRank(communityKey, userId);
    return rank !== null ? rank + 1 : 0;
  }

  public async removeUserFromCommunityLeaderboard(userId: string, communityId: string): Promise<void> {
    const communityKey = `leaderboard:community:${communityId}`;
    await (redisClient.getClient() as any).zRem(communityKey, userId);
  }

  public async updateScore(
    userId: string, 
    problemId: string, 
    difficulty: string
  ): Promise<void> {
    const userScoreKey = `${SCORE_KEY_PREFIX}${userId}`;
    
    // 1. Prevent double scoring
    const isSolved = await redisClient.get(`${userScoreKey}:problem:${problemId}`);
    if (isSolved) return;

    // 2. Determine point value
    const scoreIncrement = SCORE_VALUES[difficulty as keyof typeof SCORE_VALUES];
    if (!scoreIncrement) return;

    await redisClient.set(`${userScoreKey}:problem:${problemId}`, '1');

    // 3. Update Global Leaderboard
    await (redisClient.getClient() as any).zIncrBy(GLOBAL_LEADERBOARD_KEY, scoreIncrement, userId);

    // 4. Update Community Leaderboards
    const memberships = await CommunityMember.find({ userId }).select('communityId');
    for (const membership of memberships) {
      const communityKey = `leaderboard:community:${membership.communityId}`;
      await (redisClient.getClient() as any).zIncrBy(communityKey, scoreIncrement, userId);
    }

    // 5. Update metadata
    await redisClient.set(`${userScoreKey}:lastSolved`, Date.now().toString());
    await (redisClient.getClient() as any).incr(`${userScoreKey}:solved`);

    await this.persistToMongoDB(userId);
  }

  public async getUserScore(userId: string): Promise<number> {
    const score = await redisClient.zScore(GLOBAL_LEADERBOARD_KEY, userId);
    return Math.floor(score || 0);
  }

  public async getUserRank(userId: string): Promise<number> {
    const rank = await redisClient.zRank(GLOBAL_LEADERBOARD_KEY, userId);
    return rank !== null ? rank + 1 : 0;
  }

  public async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<any[]> {
    const entries = await redisClient.zRevRangeWithScores(
      GLOBAL_LEADERBOARD_KEY, 
      offset, 
      offset + limit - 1
    );
    return this.populateUserData(entries, offset);
  }

  public async getCommunityLeaderboard(
    communityId: string, 
    limit: number = 100, 
    offset: number = 0
  ): Promise<any[]> {
    const communityKey = `leaderboard:community:${communityId}`;
    const entries = await redisClient.zRevRangeWithScores(
      communityKey, 
      offset, 
      offset + limit - 1
    );
    return this.populateUserData(entries, offset);
  }

  /**
   * Internal helper to fetch user profiles and format entries.
   */
  private async populateUserData(entries: any[], offset: number): Promise<any[]> {
    const userIds = entries.map(e => e.value);
    
    // ✅ FIX: Select avatarUrl along with displayName
    const users = await User.find({ _id: { $in: userIds } }).select('displayName email avatarUrl');
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    return entries.map((entry, index) => {
      const user = userMap.get(entry.value);
      return {
        userId: entry.value,
        displayName: user?.displayName || user?.email || 'Anonymous',
        avatarUrl: user?.avatarUrl || "", // ✅ Return avatarUrl
        score: Math.floor(entry.score),
        rank: offset + index + 1,
      };
    });
  }

  public async rebuildLeaderboard(): Promise<{ usersRebuilt: number; solvedProblems: number }> {
    logger.info('Rebuilding DSA leaderboards from MongoDB...');
    
    const client = redisClient.getClient();
    const keys = [
      ...(await client.keys('leaderboard:*')),
      ...(await client.keys(`${SCORE_KEY_PREFIX}*`)),
    ];

    if (keys.length > 0) {
      await client.del(keys);
    }

    const scores = await Submission.aggregate([
      { $match: { status: 'accepted', problemId: { $exists: true } } },
      { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
      { $unwind: '$problem' },
      { $match: { 'problem.type': 'dsa' } },
      // A user earns points only once for each DSA problem, regardless of
      // how many accepted submissions they made for it.
      {
        $group: {
          _id: { userId: '$userId', problemId: '$problemId' },
          difficulty: { $first: '$problem.difficulty' },
          lastSolvedAt: { $max: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$_id.userId',
          solvedCount: { $sum: 1 },
          totalScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$difficulty', 'easy'] }, then: 20 },
                  { case: { $eq: ['$difficulty', 'medium'] }, then: 30 },
                  { case: { $eq: ['$difficulty', 'hard'] }, then: 50 },
                ],
                default: 0 
              }
            }
          },
          lastSolvedAt: { $max: '$createdAt' }
        }
      }
    ]);

    const pipeline = client.multi();

    for (const entry of scores) {
      const userId = entry._id.toString();
      const score = entry.totalScore;

      pipeline.zAdd(GLOBAL_LEADERBOARD_KEY, { score, value: userId });
      pipeline.set(`${SCORE_KEY_PREFIX}${userId}:solved`, entry.solvedCount.toString());
      pipeline.set(`${SCORE_KEY_PREFIX}${userId}:lastSolved`, entry.lastSolvedAt.getTime().toString());

      const memberships = await CommunityMember.find({ userId }).select('communityId');
      for (const m of memberships) {
        pipeline.zAdd(`leaderboard:community:${m.communityId}`, { score, value: userId });
      }
    }

    await pipeline.exec();
    logger.info('Leaderboards successfully rebuilt for DSA problems.');

    return {
      usersRebuilt: scores.length,
      solvedProblems: scores.reduce((total, entry) => total + entry.solvedCount, 0),
    };
  }

  private async persistToMongoDB(userId: string): Promise<void> {
    // Logic for database persistence if needed
  }
}

export const leaderboardService = new LeaderboardService();
