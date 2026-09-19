import { Router, Response } from "express";
import { User, Submission, Problem, CommunityMember } from "../models/index";
import { AuthenticatedRequest } from "../types/index";
import { authMiddleware } from "../middleware/auth";
import { leaderboardService } from "../services/leaderboardService";
import { asyncHandler } from "../middleware/errorHandler";
import mongoose from "mongoose";

const router = Router();

// ============================================================================
//  NEW: UNIFIED PROFILE ENDPOINT
// ============================================================================

router.get(
  "/profile/:userId",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
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
    const user = await User.findById(requestUserId).select(
      "-firebaseUid -password -__v"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. Parallel Fetching for Stats
    const [
      totalSubmissions,
      difficultyStats,
      heatmapData,
      recentActivity,
      score,
      rank,
      communities,
    ] = await Promise.all([
      // A. Total Count
      Submission.countDocuments({ userId: requestUserId }),

      // B. Difficulty Breakdown
      Submission.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(requestUserId),
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
      Submission.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(requestUserId),
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
      Submission.find({ userId: requestUserId, problemId: { $exists: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("problemId", "title difficulty slug"), 

      // E. Leaderboard Stats
      leaderboardService.getUserScore(requestUserId),
      leaderboardService.getUserRank(requestUserId),

      // F. Communities
      (async () => {
        const memberships = await CommunityMember.find({
          userId: requestUserId,
        })
          .populate("communityId", "name description icon") 
          .limit(6); 

        return memberships.map((m: any) => ({
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
  })
);

// ============================================================================
//  EXISTING ROUTES (Legacy / Me)
// ============================================================================

router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.userId).select("-firebaseUid");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user });
  })
);

router.patch(
  "/me",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { displayName, bio, socialLinks } = req.body; 
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (displayName !== undefined) user.displayName = displayName;
    if (bio !== undefined) user.bio = bio;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;

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
  })
);

router.get(
  "/me/stats",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id.toString();
    
    const totalSubmissions = await Submission.countDocuments({
      userId: userId,
    });
    const dsaSubmissions = await Submission.countDocuments({
      userId: userId,
      problemId: { $exists: true },
    });
    const mcqAttempts = await Submission.countDocuments({
      userId: userId,
      mcqId: { $exists: true },
    });

    const problemsSolved = await Submission.distinct("problemId", {
      userId: userId,
      status: "accepted",
      problemId: { $exists: true },
    });

    const score = await leaderboardService.getUserScore(userId);
    const rank = await leaderboardService.getUserRank(userId);

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
  })
);

router.get(
  "/me/solved",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const solvedProblemIds = await Submission.distinct("problemId", {
      userId: req.userId,
      status: "accepted",
      problemId: { $exists: true },
    });
    return res.json({ solved: solvedProblemIds });
  })
);

// Communities for a specific user OR logged in user
router.get(
  "/:userId/communities",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check URL param first. If it's "me", use auth ID. Else use param.
    const paramId = req.params.userId;
    const userId = paramId === 'me' ? req.user._id.toString() : paramId;

    const memberships = await CommunityMember.find({ userId })
      .populate("communityId")
      .sort({ joinedAt: -1 });

    const communities = memberships.map((m) => ({
      id: (m.communityId as any)._id,
      name: (m.communityId as any).name,
      description: (m.communityId as any).description,
      type: (m.communityId as any).type,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return res.json({ communities });
  })
);

export default router;
