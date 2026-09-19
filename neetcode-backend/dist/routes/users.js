"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const leaderboardService_1 = require("../services/leaderboardService");
const errorHandler_1 = require("../middleware/errorHandler");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// ============================================================================
//  NEW: UNIFIED PROFILE ENDPOINT
// ============================================================================
router.get("/profile/:userId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // ✅ FIX: Get the ID from the URL Parameter
    // If the URL is /profile/123, this will be "123"
    let { userId } = req.params;
    // Optional: specific check if frontend sends "me" literal
    if (userId === "me") {
        userId = req.user._id.toString();
    }
    const requestUserId = userId;
    console.log("Fetching profile for:", requestUserId);
    // 1. Fetch User Basics
    const user = await index_1.User.findById(requestUserId).select("-firebaseUid -password -__v");
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    // 2. Parallel Fetching for Stats
    const [totalSubmissions, difficultyStats, heatmapData, recentActivity, score, rank, communities,] = await Promise.all([
        // A. Total Count
        index_1.Submission.countDocuments({ userId: requestUserId }),
        // B. Difficulty Breakdown
        index_1.Submission.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(requestUserId),
                    status: "accepted",
                },
            },
            {
                $lookup: {
                    from: "problems",
                    localField: "problemId",
                    foreignField: "_id",
                    as: "problem",
                },
            },
            { $unwind: "$problem" },
            {
                $group: {
                    _id: "$problem.difficulty",
                    count: { $sum: 1 },
                },
            },
        ]),
        // C. Submission Heatmap
        index_1.Submission.aggregate([
            {
                $match: {
                    userId: new mongoose_1.default.Types.ObjectId(requestUserId),
                    createdAt: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 365)),
                    },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
        ]),
        // D. Recent Activity
        index_1.Submission.find({ userId: requestUserId, problemId: { $exists: true } })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("problemId", "title difficulty slug"),
        // E. Leaderboard Stats
        leaderboardService_1.leaderboardService.getUserScore(requestUserId),
        leaderboardService_1.leaderboardService.getUserRank(requestUserId),
        // F. Communities
        (async () => {
            const memberships = await index_1.CommunityMember.find({
                userId: requestUserId,
            })
                .populate("communityId", "name description icon")
                .limit(6);
            return memberships.map((m) => ({
                id: m.communityId._id,
                name: m.communityId.name,
                role: m.role,
            }));
        })(),
    ]);
    // 3. Format Difficulty Stats
    const solvedStats = {
        easy: difficultyStats.find((s) => s._id === "Easy")?.count || 0,
        medium: difficultyStats.find((s) => s._id === "Medium")?.count || 0,
        hard: difficultyStats.find((s) => s._id === "Hard")?.count || 0,
        total: difficultyStats.reduce((acc, curr) => acc + curr.count, 0),
    };
    // 4. Send Consolidated Response
    return res.json({
        profile: {
            details: user,
            stats: {
                score,
                rank,
                totalSubmissions,
                solvedBreakdown: solvedStats,
            },
            activity: {
                heatmap: heatmapData,
                recent: recentActivity,
            },
            communities,
        },
    });
}));
// ============================================================================
//  EXISTING ROUTES (Legacy / Me)
// ============================================================================
router.get("/me", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await index_1.User.findById(req.userId).select("-firebaseUid");
    if (!user)
        return res.status(404).json({ error: "User not found" });
    return res.json({ user });
}));
router.patch("/me", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { displayName, bio, socialLinks } = req.body;
    const user = await index_1.User.findById(req.userId);
    if (!user)
        return res.status(404).json({ error: "User not found" });
    if (displayName !== undefined)
        user.displayName = displayName;
    if (bio !== undefined)
        user.bio = bio;
    if (socialLinks !== undefined)
        user.socialLinks = socialLinks;
    await user.save();
    return res.json({
        user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            bio: user.bio,
        },
    });
}));
router.get("/me/stats", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user._id.toString();
    const totalSubmissions = await index_1.Submission.countDocuments({
        userId: userId,
    });
    const dsaSubmissions = await index_1.Submission.countDocuments({
        userId: userId,
        problemId: { $exists: true },
    });
    const mcqAttempts = await index_1.Submission.countDocuments({
        userId: userId,
        mcqId: { $exists: true },
    });
    const problemsSolved = await index_1.Submission.distinct("problemId", {
        userId: userId,
        status: "accepted",
        problemId: { $exists: true },
    });
    const score = await leaderboardService_1.leaderboardService.getUserScore(userId);
    const rank = await leaderboardService_1.leaderboardService.getUserRank(userId);
    return res.json({
        stats: {
            totalSubmissions,
            dsaSubmissions,
            mcqAttempts,
            problemsSolved: problemsSolved.length,
            score,
            rank,
        },
    });
}));
router.get("/me/solved", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const solvedProblemIds = await index_1.Submission.distinct("problemId", {
        userId: req.userId,
        status: "accepted",
        problemId: { $exists: true },
    });
    return res.json({ solved: solvedProblemIds });
}));
// Communities for a specific user OR logged in user
router.get("/:userId/communities", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // Check URL param first. If it's "me", use auth ID. Else use param.
    const paramId = req.params.userId;
    const userId = paramId === 'me' ? req.user._id.toString() : paramId;
    const memberships = await index_1.CommunityMember.find({ userId })
        .populate("communityId")
        .sort({ joinedAt: -1 });
    const communities = memberships.map((m) => ({
        id: m.communityId._id,
        name: m.communityId.name,
        description: m.communityId.description,
        type: m.communityId.type,
        role: m.role,
        joinedAt: m.joinedAt,
    }));
    return res.json({ communities });
}));
exports.default = router;
