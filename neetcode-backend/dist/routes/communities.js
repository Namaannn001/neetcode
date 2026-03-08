"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const leaderboardService_1 = require("../services/leaderboardService");
const errorHandler_1 = require("../middleware/errorHandler");
const redis_1 = require("../utils/redis");
const router = (0, express_1.Router)();
// ==========================================
// 1. General Routes (Create, List)
// ==========================================
/**
 * @route   POST /api/communities
 * @desc    Create a new community and set creator as owner
 */
router.post("/", auth_1.authMiddleware, // ✅ enable
(0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const community = new index_1.Community({
        name,
        description,
        ownerId: req.userId, // ✅ mongo userId
        type,
        domain: type === "domain_restricted" ? domain.toLowerCase().trim() : undefined,
        memberCount: 1,
    });
    await community.save();
    await index_1.CommunityMember.create({
        communityId: community._id,
        userId: req.userId,
        role: "owner",
    });
    await leaderboardService_1.leaderboardService.addUserToCommunityLeaderboard(req.userId, community._id.toString());
    return res.status(201).json({ community });
}));
/**
 * @route   GET /api/communities
 * @desc    List all communities with server-side search and filtering
 */
router.get("/", 
// authMiddleware,
(0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type, search } = req.query;
    const filter = {};
    if (type)
        filter.type = type;
    if (search) {
        // Case-insensitive search on name or description
        filter.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }
    const communities = await index_1.Community.find(filter)
        .populate("ownerId", "displayName email") // Only fetch necessary owner fields
        .sort({ memberCount: -1, createdAt: -1 }) // Sort by popularity, then recency
        .limit(50); // Performance limit
    return res.json({ communities });
    // res.json(communities); // NOTE: Frontend expects array directly or { communities: [] }? 
    // Based on previous code it was res.json({ communities }), but standard REST often returns array.
    // Keeping consistency with your previous snippet:
    // res.json({ communities });
}));
// ==========================================
// 2. Specific Community Routes (Details, Members)
// ==========================================
/**
 * @route   GET /api/communities/:communityId
 * @desc    Get details + Current User's Role (Optimized single query)
 */
router.get("/:communityId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const community = await index_1.Community.findById(communityId).populate("ownerId", "displayName email");
    if (!community) {
        return res.status(404).json({ error: "Community not found" });
    }
    // Check membership in parallel or simplified query
    const membership = await index_1.CommunityMember.findOne({
        communityId,
        userId: req.userId,
    }).select("role");
    console.log("membership data : ", membership);
    console.log("community data : ", community);
    return res.json({
        community,
        isMember: !!membership,
        userRole: membership?.role, // Returns 'owner', 'admin', 'member', or null
    });
}));
/**
 * @route   GET /api/communities/:communityId/members
 * @desc    Get member list (Paginated)
 */
router.get("/:communityId/members", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    // Optional: Check if user is allowed to see members (e.g. must be a member for private groups)
    // For now, assuming open visibility or frontend handles masking.
    const members = await index_1.CommunityMember.find({ communityId })
        .populate("userId", "displayName email avatarUrl") // Added avatarUrl if it exists
        .sort({ role: 1, joinedAt: -1 }) // Owners/Admins first, then newest
        .skip(Number(offset))
        .limit(Number(limit));
    return res.json(members);
}));
// ==========================================
// 3. User Actions (Join, Leave)
// ==========================================
/**
 * @route   POST /api/communities/:communityId/join
 * @desc    Join a community with domain verification
 */
router.post("/:communityId/join", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const community = await index_1.Community.findById(communityId);
    if (!community)
        return res.status(404).json({ error: "Community not found" });
    // Check existing membership
    const existing = await index_1.CommunityMember.exists({
        communityId,
        userId: req.userId,
    });
    console.log("existing member check :", existing);
    if (existing)
        return res.status(400).json({ error: "Already a member" });
    // Domain Verification
    if (community.type === "domain_restricted" && community.domain) {
        const user = await index_1.User.findById(req.userId);
        const userEmailDomain = user?.email.split("@")[1].toLowerCase().trim();
        const requiredDomain = community.domain.toLowerCase().trim();
        if (userEmailDomain !== requiredDomain) {
            return res.status(403).json({
                error: `Access restricted. You need a verified @${requiredDomain} email.`,
            });
        }
    }
    // Create Member
    await index_1.CommunityMember.create({
        communityId,
        userId: req.userId,
        role: "member",
    });
    // Atomic Increment
    await index_1.Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } });
    // Sync to Leaderboard
    await leaderboardService_1.leaderboardService.addUserToCommunityLeaderboard(req.userId, communityId);
    return res.json({ message: "Joined successfully" });
}));
/**
 * @route   DELETE /api/communities/:communityId/leave
 * @desc    Leave community
 */
router.delete("/:communityId/leave", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const member = await index_1.CommunityMember.findOne({
        communityId,
        userId: req.userId,
    });
    if (!member)
        return res.status(400).json({ error: "Not a member" });
    if (member.role === "owner") {
        return res.status(400).json({ error: "Owners cannot leave. Transfer ownership or delete the community." });
    }
    await index_1.CommunityMember.deleteOne({ _id: member._id });
    // Atomic Decrement
    await index_1.Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });
    // Remove from Leaderboard
    await leaderboardService_1.leaderboardService.removeUserFromCommunityLeaderboard(req.userId, communityId);
    return res.json({ message: "Left successfully" });
}));
// ==========================================
// 4. Admin/Owner Actions (Settings, Manage Members)
// ==========================================
/**
 * @route   PATCH /api/communities/:communityId/settings
 * @desc    Update settings (Owner Only)
 */
router.patch("/:communityId/settings", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const { name, description } = req.body;
    const community = await index_1.Community.findById(communityId);
    if (!community)
        return res.status(404).json({ error: "Community not found" });
    if (community.ownerId.toString() !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    if (name)
        community.name = name;
    if (description)
        community.description = description;
    await community.save();
    return res.json({ community });
}));
/**
 * @route   DELETE /api/communities/:communityId
 * @desc    Delete community (Owner Only)
 */
router.delete("/:communityId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const community = await index_1.Community.findById(communityId);
    if (!community)
        return res.status(404).json({ error: "Community not found" });
    if (community.ownerId.toString() !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    // Clean up members first (needed for leaderboard cleanup)
    const members = await index_1.CommunityMember.find({ communityId }).select("userId");
    // Remove Redis Data
    const communityKey = `leaderboard:community:${communityId}`;
    await redis_1.redisClient.getClient().del(communityKey);
    // Remove users from leaderboard mapping (Async/Parallel for speed)
    await Promise.all(members.map((m) => leaderboardService_1.leaderboardService.removeUserFromCommunityLeaderboard(m.userId.toString(), communityId)));
    await index_1.CommunityMember.deleteMany({ communityId });
    await index_1.Community.deleteOne({ _id: communityId });
    return res.json({ message: "Community deleted successfully" });
}));
/**
 * @route   POST /api/communities/:communityId/transfer-owner
 * @desc    Transfer ownership (Owner Only)
 */
router.post("/:communityId/transfer-owner", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const { newOwnerId } = req.body;
    const community = await index_1.Community.findById(communityId);
    if (!community)
        return res.status(404).json({ error: "Community not found" });
    if (community.ownerId.toString() !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    // Verify new owner is a member
    const newOwnerMember = await index_1.CommunityMember.findOne({ communityId, userId: newOwnerId });
    if (!newOwnerMember)
        return res.status(400).json({ error: "User is not a member" });
    // Downgrade current owner to member
    await index_1.CommunityMember.updateOne({ communityId, userId: req.userId }, { role: "member" });
    // Upgrade new owner
    newOwnerMember.role = "owner";
    await newOwnerMember.save();
    // Update Community Reference
    community.ownerId = newOwnerId;
    await community.save();
    return res.json({ message: "Ownership transferred", community });
}));
/**
 * @route   POST /api/communities/:communityId/promote
 * @desc    Promote member to Admin (Owner Only)
 */
router.post("/:communityId/promote", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId } = req.params;
    const { userId } = req.body;
    const community = await index_1.Community.findById(communityId);
    if (!community || community.ownerId.toString() !== req.userId) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    await index_1.CommunityMember.updateOne({ communityId, userId }, { role: "admin" });
    return res.json({ message: "User promoted to admin" });
}));
/**
 * @route   DELETE /api/communities/:communityId/members/:userId
 * @desc    Remove a member (Owner/Admin only)
 */
router.delete("/:communityId/members/:userId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { communityId, userId } = req.params;
    // 1. Check requester permissions
    const requester = await index_1.CommunityMember.findOne({ communityId, userId: req.userId });
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    // 2. Check target status
    const target = await index_1.CommunityMember.findOne({ communityId, userId });
    if (!target)
        return res.status(404).json({ error: "Member not found" });
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
    await index_1.CommunityMember.deleteOne({ _id: target._id });
    await index_1.Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });
    await leaderboardService_1.leaderboardService.removeUserFromCommunityLeaderboard(userId, communityId);
    return res.json({ message: "Member removed" });
}));
exports.default = router;
