import type { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
export declare function initializeFirebase(): admin.app.App;
export declare function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken>;
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireRole(role: "admin" | "user"): (req: Request, res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map