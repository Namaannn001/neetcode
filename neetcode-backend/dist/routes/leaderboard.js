"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const leaderboardService_1 = require("../services/leaderboardService");
const index_1 = require("../models/index");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.get('/global', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 100, offset = 0 } = req.query;
    const leaderboard = await leaderboardService_1.leaderboardService.getGlobalLeaderboard(Number(limit), Number(offset));
    return res.json({ leaderboard });
}));
router.get('/global/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const score = await leaderboardService_1.leaderboardService.getUserScore(userId);
    const solvedCount = await leaderboardService_1.leaderboardService.getUserSolvedCount(userId);
    const rank = await leaderboardService_1.leaderboardService.getUserRank(userId);
    return res.json({
        me: {
            userId,
            score,
            solvedCount,
            rank,
        },
    });
}));
router.get('/community/:communityId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const community = await index_1.CommunityMember.findOne({ communityId, userId: req.userId });
    if (!community) {
        return res.status(403).json({ error: 'Not a member of this community' });
    }
    const leaderboard = await leaderboardService_1.leaderboardService.getCommunityLeaderboard(communityId, Number(limit), Number(offset));
    return res.json({ leaderboard });
}));
router.get('/community/:communityId/me', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const userId = req.userId;
    const membership = await index_1.CommunityMember.findOne({ communityId, userId });
    if (!membership) {
        return res.status(403).json({ error: 'Not a member of this community' });
    }
    const score = await leaderboardService_1.leaderboardService.getUserScore(userId);
    const solvedCount = await leaderboardService_1.leaderboardService.getUserSolvedCount(userId);
    const rank = await leaderboardService_1.leaderboardService.getMyRankInCommunity(userId, communityId);
    return res.json({
        me: {
            userId,
            score,
            solvedCount,
            rank,
        },
    });
}));
exports.default = router;
