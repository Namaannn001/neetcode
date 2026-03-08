import type { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { config } from "../config/index";
import { User } from "../models/index";
import { AuthenticatedRequest } from "../types/index";
import { logger } from "../logger/index";

let firebaseApp: admin.app.App | null = null;

// ---------- Firebase Init ----------
export function initializeFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey?.replace(/\\n/g, "\n"),
      }),
    });

    logger.info("Firebase initialized successfully");
    return firebaseApp;
  } catch (error) {
    logger.error("Firebase initialization failed:", error);
    throw error;
  }
}

// ---------- Token Verification ----------
export async function verifyFirebaseToken(
  token: string
): Promise<admin.auth.DecodedIdToken> {
  try {
    const app = initializeFirebase();
    console.log("token verification started", );
    return await app.auth().verifyIdToken(token);
  } catch (error) {
    logger.error("Firebase token verification failed:", error);
    throw new Error("Invalid or expired token");
  }
}

// ---------- Core Auth Middleware ----------
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized - No token" });
    }

    const decoded = await verifyFirebaseToken(token);

    // ✅ optional strict checks
    if (!decoded.email_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    // ✅ Always save firebase uid
    req.firebaseUid = decoded.uid;
    req.email = decoded.email;

    // ✅ convert firebase uid → mongo user
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      return res.status(401).json({ error: "User not found in MongoDB" });
    }

    // ✅ IMPORTANT: set Mongo id into req.userId
    req.userId = user._id.toString();
    req.role = user.role;
    req.user = user;

    // ✅ MOST IMPORTANT
    next();
  } catch (err) {
    console.log("AUTH ERROR:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
  return null;
};



// ---------- Role Middleware (Reusable) ----------
export function requireRole(role: "admin" | "user") {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.role) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (req.role !== role) {
      res.status(403).json({ error: `Requires ${role} role` });
      return;
    }

    next();
  };
}

export const adminMiddleware = requireRole("admin");

// ---------- Optional Auth Middleware ----------
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.substring(7);
  if (!token) return next();

  verifyFirebaseToken(token)
    .then(async (decoded) => {
      // 🔒 Optional: You can also enforce it here if you want strictly no context for unverified
      if (!decoded.email_verified) return next();

      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (user) {
        req.userId = user._id.toString();
        req.email = user.email;
        req.role = user.role;
      }
      next();
    })
    .catch(() => next());
}
