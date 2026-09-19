"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const numberFromEnv = (value, fallback) => {
    const parsed = Number.parseInt(value ?? '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};
exports.config = {
    port: numberFromEnv(process.env.PORT, 3001),
    nodeEnv: process.env.NODE_ENV,
    mongodb: {
        uri: process.env.MONGODB_URI,
        database: "neetcode"
    },
    redis: {
        // A complete URL takes precedence and supports hosted providers such as
        // Upstash (for example: rediss://default:<password>@<host>:6379).
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST,
        port: numberFromEnv(process.env.REDIS_PORT, 6379),
        password: process.env.REDIS_PASSWORD,
        db: numberFromEnv(process.env.REDIS_DB, 0),
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    judge0: {
        apiUrl: process.env.JUDGE0_API_URL || 'https://ce.judge0.com',
        apiKey: process.env.JUDGE0_API_KEY || '',
        pollingInterval: numberFromEnv(process.env.JUDGE0_POLLING_INTERVAL, 1000),
        maxPollingAttempts: numberFromEnv(process.env.JUDGE0_MAX_POLLING_ATTEMPTS, 20),
    },
    rateLimit: {
        windowMs: numberFromEnv(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
        maxRequests: numberFromEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    },
    cors: {
        origin: process.env.CORS_ORIGIN,
    },
};
