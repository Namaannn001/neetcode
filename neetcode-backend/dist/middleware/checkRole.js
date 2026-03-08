"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
// middleware/checkRole.ts
const checkRole = (role) => (req, res, next) => {
    if (!req.userRole || req.userRole !== role) {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
};
exports.checkRole = checkRole;
