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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authenticatedRequest = req as AuthenticatedRequest;

  try {
    const token =
      authenticatedRequest.cookies?.token ||
      authenticatedRequest.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Unauthorized - No token" });
      return;
    }

    const decoded = await verifyFirebaseToken(token);

    // ✅ optional strict checks
    if (!decoded.email_verified) {
      res.status(403).json({ error: "Email not verified" });
      return;
    }

    // ✅ Always save firebase uid
    authenticatedRequest.firebaseUid = decoded.uid;
    authenticatedRequest.email = decoded.email;

    // ✅ convert firebase uid → mongo user
    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      res.status(401).json({ error: "User not found in MongoDB" });
      return;
    }

    // ✅ IMPORTANT: set Mongo id into req.userId
    authenticatedRequest.userId = user._id.toString();
    authenticatedRequest.role = user.role;
    authenticatedRequest.user = user;

    // ✅ MOST IMPORTANT
    next();
  } catch (err) {
    console.log("AUTH ERROR:", err);
    res.status(401).json({ error: "Invalid token" });
  }
};



// ---------- Role Middleware (Reusable) ----------
export function requireRole(role: "admin" | "user") {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.role) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (authenticatedRequest.role !== role) {
      res.status(403).json({ error: `Requires ${role} role` });
      return;
    }

    next();
  };
}

export const adminMiddleware = requireRole("admin");

// ---------- Optional Auth Middleware ----------
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authenticatedRequest = req as AuthenticatedRequest;
  const authHeader = authenticatedRequest.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) return next();

  const token = authHeader.substring(7);
  if (!token) return next();

  verifyFirebaseToken(token)
    .then(async (decoded) => {
      // 🔒 Optional: You can also enforce it here if you want strictly no context for unverified
      if (!decoded.email_verified) return next();

      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (user) {
        authenticatedRequest.userId = user._id.toString();
        authenticatedRequest.email = user.email;
        authenticatedRequest.role = user.role;
      }
      next();
    })
    .catch(() => next());
}
