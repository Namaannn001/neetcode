"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const index_2 = require("../logger/index");
const auth_1 = require("../middleware/auth");
const validators_1 = require("../utils/validators");
const validators_2 = require("../utils/validators");
const leaderboardService_1 = require("../services/leaderboardService");
const errorHandler_1 = require("../middleware/errorHandler");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
router.post("/register", (0, validators_2.validateRequest)(validators_1.registerSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { firebaseUid, email, displayName } = req.body;
    const { idToken } = req.body;
    // Verify token to get the picture/avatar if available
    let avatarUrl = "";
    try {
        const decoded = await (0, auth_1.verifyFirebaseToken)(idToken);
        avatarUrl = decoded.picture || "";
    }
    catch (e) {
        // Token verification optional here if just checking existence, 
        // but good for extracting extra data safely
    }
    const existingUser = await index_1.User.findOne({ idToken });
    if (existingUser) {
        return res.status(200).json({
            user: {
                id: existingUser._id,
                email: existingUser.email,
                displayName: existingUser.displayName,
                avatarUrl: existingUser.avatarUrl, // Return avatar
                role: existingUser.role,
            },
            message: "Login successful",
        });
    }
    const emailUser = await index_1.User.findOne({ email });
    if (emailUser) {
        return res.status(400).json({ error: "Email already registered" });
    }
    const user = await index_1.User.create({
        firebaseUid,
        email,
        displayName,
        avatarUrl, // Save the avatar from Google
        role: "user",
    });
    leaderboardService_1.leaderboardService
        .initializeUser(user._id.toString())
        .catch((err) => index_2.logger.error("Leaderboard init failed", err));
    index_2.logger.info("User registered", { userId: user._id });
    return res.status(201).json({
        user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            role: user.role,
        },
    });
}));
router.post("/admin/promote", auth_1.verifyFirebaseToken, (0, checkRole_1.checkRole)("admin"), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    const user = await index_1.User.findByIdAndUpdate(userId, { role: "admin" }, { new: true });
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({
        message: "User promoted to admin",
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    });
}));
router.post("/login", (0, validators_2.validateRequest)(validators_1.loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    // 1️⃣ Verify token
    const decoded = await (0, auth_1.verifyFirebaseToken)(idToken);
    if (!decoded.email_verified) {
        return res.status(403).json({
            error: "Email not verified",
        });
    }
    // 2️⃣ Find user by firebase UID
    let user = await index_1.User.findOne({ firebaseUid: decoded.uid });
    // 3️⃣ Auto-create user if first login
    if (!user) {
        user = await index_1.User.create({
            firebaseUid: decoded.uid,
            email: decoded.email,
            displayName: decoded.name || decoded.email,
            avatarUrl: decoded.picture || "", // ✅ Fetch avatar on creation
            role: "user",
        });
    }
    else {
        // ✅ SYNC: Update avatar from Google if it has changed
        // We do NOT overwrite displayName so the user's edited name persists
        if (decoded.picture && user.avatarUrl !== decoded.picture) {
            user.avatarUrl = decoded.picture;
            await user.save();
        }
    }
    // 4️⃣ Return backend user
    return res.status(200).json({
        user: {
            id: user._id.toString(),
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl, // ✅ Return avatar to frontend
            role: user.role,
        },
    });
}));
router.post("/logout", (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    return res.json({ message: "Logged out successfully" });
}));
router.get("/me", (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await index_1.User.findById(req.userId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({
        user: {
            id: user._id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl, // ✅ Ensure avatar is returned
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
}));
router.post("/refresh-token", (0, validators_2.validateRequest)(validators_1.loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    await (0, auth_1.verifyFirebaseToken)(idToken);
    return res.json({
        idToken,
        message: "Token refreshed",
    });
}));
router.post("/verify-token", (0, validators_2.validateRequest)(validators_1.loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const decodedToken = await (0, auth_1.verifyFirebaseToken)(idToken);
    return res.json({
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email,
    });
}));
exports.default = router;
