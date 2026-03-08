import type { Response, NextFunction } from "express";
import admin from "firebase-admin";
import { AuthenticatedRequest } from "../types/index";
export declare function initializeFirebase(): admin.app.App;
export declare function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken>;
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function requireRole(role: "admin" | "user"): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const adminMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map