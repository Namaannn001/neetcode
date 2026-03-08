"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
exports.initializeFirebase = initializeFirebase;
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.requireRole = requireRole;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = require("../config/index");
const index_2 = require("../models/index");
const index_3 = require("../logger/index");
let firebaseApp = null;
// ---------- Firebase Init ----------
function initializeFirebase() {
    if (firebaseApp)
        return firebaseApp;
    try {
        firebaseApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: index_1.config.firebase.projectId,
                clientEmail: index_1.config.firebase.clientEmail,
                privateKey: index_1.config.firebase.privateKey?.replace(/\\n/g, "\n"),
            }),
        });
        index_3.logger.info("Firebase initialized successfully");
        return firebaseApp;
    }
    catch (error) {
        index_3.logger.error("Firebase initialization failed:", error);
        throw error;
    }
}
// ---------- Token Verification ----------
async function verifyFirebaseToken(token) {
    try {
        const app = initializeFirebase();
        console.log("token verification started");
        return await app.auth().verifyIdToken(token);
    }
    catch (error) {
        index_3.logger.error("Firebase token verification failed:", error);
        throw new Error("Invalid or expired token");
    }
}
// ---------- Core Auth Middleware ----------
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token ||
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
        const user = await index_2.User.findOne({ firebaseUid: decoded.uid });
        if (!user) {
            return res.status(401).json({ error: "User not found in MongoDB" });
        }
        // ✅ IMPORTANT: set Mongo id into req.userId
        req.userId = user._id.toString();
        req.role = user.role;
        req.user = user;
        // ✅ MOST IMPORTANT
        next();
    }
    catch (err) {
        console.log("AUTH ERROR:", err);
        return res.status(401).json({ error: "Invalid token" });
    }
    return null;
};
exports.authMiddleware = authMiddleware;
// ---------- Role Middleware (Reusable) ----------
function requireRole(role) {
    return (req, res, next) => {
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
exports.adminMiddleware = requireRole("admin");
// ---------- Optional Auth Middleware ----------
function optionalAuthMiddleware(req, _res, next) {
    const authHeader = req.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
        return next();
    const token = authHeader.substring(7);
    if (!token)
        return next();
    verifyFirebaseToken(token)
        .then(async (decoded) => {
        // 🔒 Optional: You can also enforce it here if you want strictly no context for unverified
        if (!decoded.email_verified)
            return next();
        const user = await index_2.User.findOne({ firebaseUid: decoded.uid });
        if (user) {
            req.userId = user._id.toString();
            req.email = user.email;
            req.role = user.role;
        }
        next();
    })
        .catch(() => next());
}
