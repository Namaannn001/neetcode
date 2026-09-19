"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.RedisClient = void 0;
const redis_1 = require("redis");
const index_1 = require("../config/index");
const index_2 = require("../logger/index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class RedisClient {
    constructor() {
        this.client = null;
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    async connect() {
        try {
            this.client = index_1.config.redis.url
                ? (0, redis_1.createClient)({ url: index_1.config.redis.url })
                : (0, redis_1.createClient)({
                    socket: {
                        host: index_1.config.redis.host,
                        port: index_1.config.redis.port,
                    },
                    password: index_1.config.redis.password || undefined,
                    database: index_1.config.redis.db,
                });
            this.client.on('error', (error) => {
                index_2.logger.error('Redis Client Error:', error);
            });
            this.client.on('connect', () => {
                index_2.logger.info('Redis connected successfully');
            });
            this.client.on('disconnect', () => {
                index_2.logger.warn('Redis disconnected');
            });
            this.client.on('reconnect', () => {
                index_2.logger.info('Redis reconnected');
            });
            await this.client.connect();
        }
        catch (error) {
            index_2.logger.error('Redis connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.client) {
                await this.client.quit();
                this.client = null;
                index_2.logger.info('Redis disconnected');
            }
        }
        catch (error) {
            index_2.logger.error('Redis disconnection failed:', error);
            throw error;
        }
    }
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }
    async set(key, value, ttl) {
        const client = this.getClient();
        if (ttl) {
            await client.setEx(key, ttl, value);
        }
        else {
            await client.set(key, value);
        }
    }
    async get(key) {
        const client = this.getClient();
        return await client.get(key);
    }
    async del(key) {
        const client = this.getClient();
        await client.del(key);
    }
    async zAdd(key, score, member) {
        const client = this.getClient();
        await client.zAdd(key, { score, value: member });
    }
    async zRangeByScoreWithScores(key, min, max, limit) {
        const client = this.getClient();
        return await client.zRangeByScoreWithScores(key, min, max, limit ? { LIMIT: { offset: limit.offset, count: limit.count } } : undefined);
    }
    async zRank(key, member) {
        const client = this.getClient();
        return await client.zRank(key, member);
    }
    async zScore(key, member) {
        const client = this.getClient();
        return await client.zScore(key, member);
    }
    async zRevRangeWithScores(key, start, stop) {
        const client = this.getClient();
        return await client.zRangeWithScores(key, start, stop, { REV: true });
    }
}
exports.RedisClient = RedisClient;
exports.redisClient = RedisClient.getInstance();
