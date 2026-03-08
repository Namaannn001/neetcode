import { Router, Response } from "express";
import { Community, CommunityMember, User } from "../models/index";
import { AuthenticatedRequest } from "../types/index";
import { authMiddleware } from "../middleware/auth";
import { leaderboardService } from "../services/leaderboardService";
import { asyncHandler } from "../middleware/errorHandler";
import { redisClient } from "../utils/redis";
import { Console } from "node:console";

const router = Router();

// ==========================================
// 1. General Routes (Create, List)
// ==========================================

/**
 * @route   POST /api/communities
 * @desc    Create a new community and set creator as owner
 */
router.post(
  "/",
  authMiddleware, // ✅ enable
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, type, domain } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: "Name and description are required" });
    }

    if (type === "domain_restricted" && !domain) {
      return res.status(400).json({ error: "Domain is required for restricted communities" });
    }

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized: userId missing" });
    }

    const community = new Community({
      name,
      description,
      ownerId: req.userId, // ✅ mongo userId
      type,
      domain: type === "domain_restricted" ? domain.toLowerCase().trim() : undefined,
      memberCount: 1,
    });

    await community.save();

    await CommunityMember.create({
      communityId: community._id,
      userId: req.userId,
      role: "owner",
    });

    await leaderboardService.addUserToCommunityLeaderboard(
      req.userId,
      community._id.toString()
    );

    return res.status(201).json({ community });
  })
);


/**
 * @route   GET /api/communities
 * @desc    List all communities with server-side search and filtering
 */
router.get(
  "/",
  // authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, search } = req.query;
    const filter: any = {};

    if (type) filter.type = type;
    if (search) {
      // Case-insensitive search on name or description
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const communities = await Community.find(filter)
      .populate("ownerId", "displayName email") // Only fetch necessary owner fields
      .sort({ memberCount: -1, createdAt: -1 }) // Sort by popularity, then recency
      .limit(50); // Performance limit

 return res.json({ communities });
   // res.json(communities); // NOTE: Frontend expects array directly or { communities: [] }? 
    // Based on previous code it was res.json({ communities }), but standard REST often returns array.
    // Keeping consistency with your previous snippet:
    // res.json({ communities });
  })
);

// ==========================================
// 2. Specific Community Routes (Details, Members)
// ==========================================

/**
 * @route   GET /api/communities/:communityId
 * @desc    Get details + Current User's Role (Optimized single query)
 */
router.get(
  "/:communityId",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;

    const community = await Community.findById(communityId).populate(
      "ownerId",
      "displayName email"
    );

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Check membership in parallel or simplified query
    const membership = await CommunityMember.findOne({
      communityId,
      userId: req.userId,
    }).select("role");
    console.log("membership data : ",membership); 
    console.log("community data : ",community);
    return res.json({
      community,
      isMember: !!membership,
      userRole: membership?.role, // Returns 'owner', 'admin', 'member', or null
    });
  })
);

/**
 * @route   GET /api/communities/:communityId/members
 * @desc    Get member list (Paginated)
 */
router.get(
  "/:communityId/members",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Optional: Check if user is allowed to see members (e.g. must be a member for private groups)
    // For now, assuming open visibility or frontend handles masking.

    const members = await CommunityMember.find({ communityId })
      .populate("userId", "displayName email avatarUrl") // Added avatarUrl if it exists
      .sort({ role: 1, joinedAt: -1 }) // Owners/Admins first, then newest
      .skip(Number(offset))
      .limit(Number(limit));

    return res.json(members);
  })
);

// ==========================================
// 3. User Actions (Join, Leave)
// ==========================================

/**
 * @route   POST /api/communities/:communityId/join
 * @desc    Join a community with domain verification
 */
router.post(
  "/:communityId/join",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const community = await Community.findById(communityId);

    if (!community) return res.status(404).json({ error: "Community not found" });

    // Check existing membership
    const existing = await CommunityMember.exists({
      communityId,
      userId: req.userId,
    });
    console.log("existing member check :",existing);
    if (existing) return res.status(400).json({ error: "Already a member" });

    // Domain Verification
    if (community.type === "domain_restricted" && community.domain) {
      const user = await User.findById(req.userId);
      const userEmailDomain = user?.email.split("@")[1].toLowerCase().trim();
      const requiredDomain = community.domain.toLowerCase().trim();

      if (userEmailDomain !== requiredDomain) {
        return res.status(403).json({
          error: `Access restricted. You need a verified @${requiredDomain} email.`,
        });
      }
    }

    // Create Member
    await CommunityMember.create({
      communityId,
      userId: req.userId,
      role: "member",
    });

    // Atomic Increment
    await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } });

    // Sync to Leaderboard
    await leaderboardService.addUserToCommunityLeaderboard(
      req.userId!,
      communityId
    );

    return res.json({ message: "Joined successfully" });
  })
);

/**
 * @route   DELETE /api/communities/:communityId/leave
 * @desc    Leave community
 */
router.delete(
  "/:communityId/leave",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;

    const member = await CommunityMember.findOne({
      communityId,
      userId: req.userId,
    });

    if (!member) return res.status(400).json({ error: "Not a member" });
    if (member.role === "owner") {
      return res.status(400).json({ error: "Owners cannot leave. Transfer ownership or delete the community." });
    }

    await CommunityMember.deleteOne({ _id: member._id });

    // Atomic Decrement
    await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });

    // Remove from Leaderboard
    await leaderboardService.removeUserFromCommunityLeaderboard(
      req.userId!,
      communityId
    );

    return res.json({ message: "Left successfully" });
  })
);

// ==========================================
// 4. Admin/Owner Actions (Settings, Manage Members)
// ==========================================

/**
 * @route   PATCH /api/communities/:communityId/settings
 * @desc    Update settings (Owner Only)
 */
router.patch(
  "/:communityId/settings",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const { name, description } = req.body;

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (community.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (name) community.name = name;
    if (description) community.description = description;

    await community.save();
    return res.json({ community });
  })
);

/**
 * @route   DELETE /api/communities/:communityId
 * @desc    Delete community (Owner Only)
 */
router.delete(
  "/:communityId",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const community = await Community.findById(communityId);

    if (!community) return res.status(404).json({ error: "Community not found" });
    if (community.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Clean up members first (needed for leaderboard cleanup)
    const members = await CommunityMember.find({ communityId }).select("userId");

    // Remove Redis Data
    const communityKey = `leaderboard:community:${communityId}`;
    await (redisClient.getClient() as any).del(communityKey);

    // Remove users from leaderboard mapping (Async/Parallel for speed)
    await Promise.all(
      members.map((m) =>
        leaderboardService.removeUserFromCommunityLeaderboard(
          m.userId.toString(),
          communityId
        )
      )
    );

    await CommunityMember.deleteMany({ communityId });
    await Community.deleteOne({ _id: communityId });

    return res.json({ message: "Community deleted successfully" });
  })
);

/**
 * @route   POST /api/communities/:communityId/transfer-owner
 * @desc    Transfer ownership (Owner Only)
 */
router.post(
  "/:communityId/transfer-owner",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const { newOwnerId } = req.body;

    const community = await Community.findById(communityId);
    if (!community) return res.status(404).json({ error: "Community not found" });

    if (community.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Verify new owner is a member
    const newOwnerMember = await CommunityMember.findOne({ communityId, userId: newOwnerId });
    if (!newOwnerMember) return res.status(400).json({ error: "User is not a member" });

    // Downgrade current owner to member
    await CommunityMember.updateOne(
      { communityId, userId: req.userId },
      { role: "member" }
    );

    // Upgrade new owner
    newOwnerMember.role = "owner";
    await newOwnerMember.save();

    // Update Community Reference
    community.ownerId = newOwnerId;
    await community.save();

    return res.json({ message: "Ownership transferred", community });
  })
);

/**
 * @route   POST /api/communities/:communityId/promote
 * @desc    Promote member to Admin (Owner Only)
 */
router.post(
  "/:communityId/promote",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const { userId } = req.body;

    const community = await Community.findById(communityId);
    if (!community || community.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await CommunityMember.updateOne({ communityId, userId }, { role: "admin" });
    return res.json({ message: "User promoted to admin" });
  })
);

/**
 * @route   DELETE /api/communities/:communityId/members/:userId
 * @desc    Remove a member (Owner/Admin only)
 */
router.delete(
  "/:communityId/members/:userId",
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { communityId, userId } = req.params;

    // 1. Check requester permissions
    const requester = await CommunityMember.findOne({ communityId, userId: req.userId });
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 2. Check target status
    const target = await CommunityMember.findOne({ communityId, userId });
    if (!target) return res.status(404).json({ error: "Member not found" });

    // 3. Hierarchy Checks
    // Owner cannot be removed
    if (target.role === "owner") {
      return res.status(400).json({ error: "Cannot remove the owner" });
    }
    // Admin cannot remove another Admin or Owner
    if (requester.role === "admin" && (target.role === "admin")) {
      return res.status(403).json({ error: "Admins cannot remove other admins/owners" });
    }

    // 4. Execute Removal
    await CommunityMember.deleteOne({ _id: target._id });
    await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });
    await leaderboardService.removeUserFromCommunityLeaderboard(userId, communityId);

    return res.json({ message: "Member removed" });
  })
);

export default router;