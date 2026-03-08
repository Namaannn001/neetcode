import { RedisClientType } from 'redis';
export declare class RedisClient {
    private static instance;
    private client;
    private constructor();
    static getInstance(): RedisClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): RedisClientType;
    set(key: string, value: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    zAdd(key: string, score: number, member: string): Promise<void>;
    zRangeByScoreWithScores(key: string, min: number, max: number, limit?: {
        offset: number;
        count: number;
    }): Promise<Array<{
        value: string;
        score: number;
    }>>;
    zRank(key: string, member: string): Promise<number | null>;
    zScore(key: string, member: string): Promise<number | null>;
    zRevRangeWithScores(key: string, start: number, stop: number): Promise<Array<{
        value: string;
        score: number;
    }>>;
}
export declare const redisClient: RedisClient;
//# sourceMappingURL=redis.d.ts.map