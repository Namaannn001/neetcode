"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./utils/dns-config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const index_1 = require("./config/index");
const database_1 = require("./utils/database");
const redis_1 = require("./utils/redis");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const index_2 = require("./logger/index");
// Routes
const auth_2 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const communities_1 = __importDefault(require("./routes/communities"));
const problems_1 = __importDefault(require("./routes/problems"));
const mcqs_1 = __importDefault(require("./routes/mcqs"));
const submissions_1 = __importDefault(require("./routes/submissions"));
const execute_1 = __importDefault(require("./routes/execute"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const admin_1 = __importDefault(require("./routes/admin"));
const PremiumProblemRoute_1 = __importDefault(require("./routes/PremiumProblemRoute"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: index_1.config.cors.origin,
    credentials: true,
}));
app.use((0, compression_1.default)());
if (index_1.config.nodeEnv === 'production')
    app.use((0, morgan_1.default)('dev'));
// Payload limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter_1.generalRateLimiter);
// Health Check
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// ✅ UPDATE 1: Mount all routes under '/api' to match Frontend expectations
app.use('/auth', auth_2.default);
app.use('/api/users', users_1.default);
app.use('/api/communities', communities_1.default);
app.use('/api/problems', problems_1.default);
app.use('/api/mcqs', mcqs_1.default);
app.use('/api/submissions', submissions_1.default);
app.use('/api/execute', execute_1.default);
app.use('/api/leaderboard', leaderboard_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/premium', PremiumProblemRoute_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const PORT = index_1.config.port;
// ✅ UPDATE 2: Connect to DBs BEFORE starting server to prevent 500 hangs
async function startServer() {
    try {
        await database_1.database.connectMongo();
        index_2.logger.info('📦 MongoDB connected');
        // Check if Redis is already open before connecting
        try {
            await redis_1.redisClient.connect();
            index_2.logger.info('🚀 Redis connected');
        }
        catch (err) {
            if (err.message !== 'Socket already opened')
                throw err;
        }
        (0, auth_1.initializeFirebase)();
        index_2.logger.info('🔥 Firebase initialized');
        app.listen(PORT, () => {
            index_2.logger.info(`✅ Server running on port ${PORT}`);
            index_2.logger.info(`   Local: http://localhost:${PORT}`);
        });
    }
    catch (error) {
        index_2.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
    index_2.logger.info("🔥 INDEX.TS LOADED");
}
startServer();
exports.default = app;
