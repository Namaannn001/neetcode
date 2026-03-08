import "./utils/dns-config";

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config/index';
import { database } from './utils/database';
import { redisClient } from './utils/redis';
import { initializeFirebase } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalRateLimiter } from './middleware/rateLimiter';
import { logger } from './logger/index';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import communityRoutes from './routes/communities';
import problemRoutes from './routes/problems';
import mcqRoutes from './routes/mcqs';
import submissionRoutes from './routes/submissions';
import executeRoutes from './routes/execute';
import leaderboardRoutes from './routes/leaderboard';
import adminRoutes from './routes/admin';
import premiumRoutes from './routes/PremiumProblemRoute';
const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin ,
  credentials: true,
}));
app.use(compression());
if (config.nodeEnv === 'production') app.use(morgan('dev'));

// Payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalRateLimiter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ✅ UPDATE 1: Mount all routes under '/api' to match Frontend expectations
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/mcqs', mcqRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/premium', premiumRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

// ✅ UPDATE 2: Connect to DBs BEFORE starting server to prevent 500 hangs
async function startServer() {
  try {
    await database.connectMongo();
    logger.info('📦 MongoDB connected');

    // Check if Redis is already open before connecting
    try {
        await redisClient.connect();
        logger.info('🚀 Redis connected');
    } catch (err: any) {
        if (err.message !== 'Socket already opened') throw err;
    }

    initializeFirebase();
    logger.info('🔥 Firebase initialized');

    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`   Local: http://localhost:${PORT}`);
      
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
  logger.info("🔥 INDEX.TS LOADED");

}

startServer();

export default app;