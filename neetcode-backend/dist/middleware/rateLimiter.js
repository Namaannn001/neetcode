"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.strictRateLimiter = exports.generalRateLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const index_1 = require("../config/index");
const createRateLimiter = (windowMs, max) => {
    return (0, express_rate_limit_1.default)({
        windowMs: windowMs || index_1.config.rateLimit.windowMs,
        max: max || index_1.config.rateLimit.maxRequests,
        message: { error: 'Too many requests, please try again later' },
        standardHeaders: true,
        legacyHeaders: false,
    });
};
exports.createRateLimiter = createRateLimiter;
exports.generalRateLimiter = (0, exports.createRateLimiter)();
exports.strictRateLimiter = (0, exports.createRateLimiter)(60000, 10); // 1 minute, 10 requests
exports.authRateLimiter = (0, exports.createRateLimiter)(300000, 5); // 5 minutes, 5 requests
