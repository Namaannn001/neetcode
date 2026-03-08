"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardService = exports.LeaderboardService = void 0;
const redis_1 = require("../utils/redis");
const index_1 = require("../models/index");
const index_2 = require("../logger/index");
const GLOBAL_LEADERBOARD_KEY = 'leaderboard:global';
const SCORE_KEY_PREFIX = 'user:score:';
// Points are strictly awarded for DSA problems
const SCORE_VALUES = {
    easy: 20,
    medium: 30,
    hard: 50,
};
class LeaderboardService {
    /**
     * Initializes Redis keys for a new user if they don't exist.
     */
    async initializeUser(userId) {
        const exists = await redis_1.redisClient.zScore(GLOBAL_LEADERBOARD_KEY, userId);
        if (exists === null) {
            await redis_1.redisClient.zAdd(GLOBAL_LEADERBOARD_KEY, 0, userId);
            await redis_1.redisClient.set(`${SCORE_KEY_PREFIX}${userId}:solved`, '0');
            await redis_1.redisClient.set(`${SCORE_KEY_PREFIX}${userId}:lastSolved`, '0');
        }
    }
    async getUserSolvedCount(userId) {
        const solved = await redis_1.redisClient.get(`${SCORE_KEY_PREFIX}${userId}:solved`);
        return Number(solved || 0);
    }
    /**
     * Syncs a user's existing global score to a specific community set when they join.
     */
    async addUserToCommunityLeaderboard(userId, communityId) {
        const score = await this.getUserScore(userId);
        const communityKey = `leaderboard:community:${communityId}`;
        await redis_1.redisClient.zAdd(communityKey, score, userId);
    }
    async getMyRankInCommunity(userId, communityId) {
        const communityKey = `leaderboard:community:${communityId}`;
        const rank = await redis_1.redisClient.zRank(communityKey, userId);
        return rank !== null ? rank + 1 : 0;
    }
    async removeUserFromCommunityLeaderboard(userId, communityId) {
        const communityKey = `leaderboard:community:${communityId}`;
        await redis_1.redisClient.getClient().zRem(communityKey, userId);
    }
    async updateScore(userId, problemId, difficulty) {
        const userScoreKey = `${SCORE_KEY_PREFIX}${userId}`;
        // 1. Prevent double scoring
        const isSolved = await redis_1.redisClient.get(`${userScoreKey}:problem:${problemId}`);
        if (isSolved)
            return;
        // 2. Determine point value
        const scoreIncrement = SCORE_VALUES[difficulty];
        if (!scoreIncrement)
            return;
        await redis_1.redisClient.set(`${userScoreKey}:problem:${problemId}`, '1');
        // 3. Update Global Leaderboard
        await redis_1.redisClient.getClient().zIncrBy(GLOBAL_LEADERBOARD_KEY, scoreIncrement, userId);
        // 4. Update Community Leaderboards
        const memberships = await index_1.CommunityMember.find({ userId }).select('communityId');
        for (const membership of memberships) {
            const communityKey = `leaderboard:community:${membership.communityId}`;
            await redis_1.redisClient.getClient().zIncrBy(communityKey, scoreIncrement, userId);
        }
        // 5. Update metadata
        await redis_1.redisClient.set(`${userScoreKey}:lastSolved`, Date.now().toString());
        await redis_1.redisClient.getClient().incr(`${userScoreKey}:solved`);
        await this.persistToMongoDB(userId);
    }
    async getUserScore(userId) {
        const score = await redis_1.redisClient.zScore(GLOBAL_LEADERBOARD_KEY, userId);
        return Math.floor(score || 0);
    }
    async getUserRank(userId) {
        const rank = await redis_1.redisClient.zRank(GLOBAL_LEADERBOARD_KEY, userId);
        return rank !== null ? rank + 1 : 0;
    }
    async getGlobalLeaderboard(limit = 100, offset = 0) {
        const entries = await redis_1.redisClient.zRevRangeWithScores(GLOBAL_LEADERBOARD_KEY, offset, offset + limit - 1);
        return this.populateUserData(entries, offset);
    }
    async getCommunityLeaderboard(communityId, limit = 100, offset = 0) {
        const communityKey = `leaderboard:community:${communityId}`;
        const entries = await redis_1.redisClient.zRevRangeWithScores(communityKey, offset, offset + limit - 1);
        return this.populateUserData(entries, offset);
    }
    /**
     * Internal helper to fetch user profiles and format entries.
     */
    async populateUserData(entries, offset) {
        const userIds = entries.map(e => e.value);
        // ✅ FIX: Select avatarUrl along with displayName
        const users = await index_1.User.find({ _id: { $in: userIds } }).select('displayName email avatarUrl');
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
    async rebuildLeaderboard() {
        index_2.logger.info('Rebuilding DSA leaderboards from MongoDB...');
        const keys = await redis_1.redisClient.getClient().keys('leaderboard:*');
        if (keys.length > 0) {
            await redis_1.redisClient.getClient().del(keys);
        }
        const scores = await index_1.Submission.aggregate([
            { $match: { status: 'accepted', problemId: { $exists: true } } },
            { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
            { $unwind: '$problem' },
            { $match: { 'problem.type': 'dsa' } },
            {
                $group: {
                    _id: '$userId',
                    solvedCount: { $sum: 1 },
                    totalScore: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$problem.difficulty', 'easy'] }, then: 20 },
                                    { case: { $eq: ['$problem.difficulty', 'medium'] }, then: 30 },
                                    { case: { $eq: ['$problem.difficulty', 'hard'] }, then: 50 },
                                ],
                                default: 0
                            }
                        }
                    },
                    lastSolvedAt: { $max: '$createdAt' }
                }
            }
        ]);
        const pipeline = redis_1.redisClient.getClient().multi();
        for (const entry of scores) {
            const userId = entry._id.toString();
            const score = entry.totalScore;
            pipeline.zAdd(GLOBAL_LEADERBOARD_KEY, { score, value: userId });
            pipeline.set(`${SCORE_KEY_PREFIX}${userId}:solved`, entry.solvedCount.toString());
            pipeline.set(`${SCORE_KEY_PREFIX}${userId}:lastSolved`, entry.lastSolvedAt.getTime().toString());
            const memberships = await index_1.CommunityMember.find({ userId }).select('communityId');
            for (const m of memberships) {
                pipeline.zAdd(`leaderboard:community:${m.communityId}`, { score, value: userId });
            }
        }
        await pipeline.exec();
        index_2.logger.info('Leaderboards successfully rebuilt for DSA problems.');
    }
    async persistToMongoDB(userId) {
        // Logic for database persistence if needed
    }
}
exports.LeaderboardService = LeaderboardService;
exports.leaderboardService = new LeaderboardService();
