export declare class LeaderboardService {
    /**
     * Initializes Redis keys for a new user if they don't exist.
     */
    initializeUser(userId: string): Promise<void>;
    getUserSolvedCount(userId: string): Promise<number>;
    /**
     * Syncs a user's existing global score to a specific community set when they join.
     */
    addUserToCommunityLeaderboard(userId: string, communityId: string): Promise<void>;
    getMyRankInCommunity(userId: string, communityId: string): Promise<number>;
    removeUserFromCommunityLeaderboard(userId: string, communityId: string): Promise<void>;
    updateScore(userId: string, problemId: string, difficulty: string): Promise<void>;
    getUserScore(userId: string): Promise<number>;
    getUserRank(userId: string): Promise<number>;
    getGlobalLeaderboard(limit?: number, offset?: number): Promise<any[]>;
    getCommunityLeaderboard(communityId: string, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Internal helper to fetch user profiles and format entries.
     */
    private populateUserData;
    rebuildLeaderboard(): Promise<void>;
    private persistToMongoDB;
}
export declare const leaderboardService: LeaderboardService;
//# sourceMappingURL=leaderboardService.d.ts.map