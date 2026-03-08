import { Router, Request, Response } from "express";
import { User } from "../models/index";
import { AuthenticatedRequest } from "../types/index";
import { logger } from "../logger/index";
import { authMiddleware, verifyFirebaseToken } from "../middleware/auth";
import { registerSchema, loginSchema } from "../utils/validators";
import { validateRequest } from "../utils/validators";
import { leaderboardService } from "../services/leaderboardService";
import { asyncHandler } from "../middleware/errorHandler";
import { checkRole } from "../middleware/checkRole";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { firebaseUid, email, displayName } = req.body;
    const { idToken } = req.body;
    
    // Verify token to get the picture/avatar if available
    let avatarUrl = "";
    try {
      const decoded = await verifyFirebaseToken(idToken);
      avatarUrl = decoded.picture || "";
    } catch (e) {
      // Token verification optional here if just checking existence, 
      // but good for extracting extra data safely
    }

    const existingUser = await User.findOne({ idToken });
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

    const emailUser = await User.findOne({ email });
    if (emailUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      firebaseUid,
      email,
      displayName,
      avatarUrl, // Save the avatar from Google
      role: "user",
    });

    leaderboardService
      .initializeUser(user._id.toString())
      .catch((err) => logger.error("Leaderboard init failed", err));

    logger.info("User registered", { userId: user._id });
    return res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  })
);

router.post(
  "/admin/promote",
  verifyFirebaseToken,
  checkRole("admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    );

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
  })
);


router.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    // 1️⃣ Verify token
    const decoded = await verifyFirebaseToken(idToken);

    if (!decoded.email_verified) {
      return res.status(403).json({
        error: "Email not verified",
      });
    }

    // 2️⃣ Find user by firebase UID
    let user = await User.findOne({ firebaseUid: decoded.uid });

    // 3️⃣ Auto-create user if first login
    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        email: decoded.email!,
        displayName: decoded.name || decoded.email,
        avatarUrl: decoded.picture || "", // ✅ Fetch avatar on creation
        role: "user",
      });
    } else {
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
  })
);

router.post(
  "/logout",
  asyncHandler(async (_req: Request, res: Response) => {
    return res.json({ message: "Logged out successfully" });
  })
);

router.get(
  "/me",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.userId);

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
  })
);

router.post(
  "/refresh-token",
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    await verifyFirebaseToken(idToken);
    return res.json({
      idToken,
      message: "Token refreshed",
    });
  })
);

router.post(
  "/verify-token",
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;
    const decodedToken = await verifyFirebaseToken(idToken);
    return res.json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  })
);

export default router;