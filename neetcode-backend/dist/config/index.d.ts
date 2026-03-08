export declare const config: {
    port: number;
    nodeEnv: string;
    mongodb: {
        uri: string;
        database: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        db: number;
    };
    firebase: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    judge0: {
        apiUrl: string;
        apiKey: string;
        pollingInterval: number;
        maxPollingAttempts: number;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    cors: {
        origin: string;
    };
};
//# sourceMappingURL=index.d.ts.map