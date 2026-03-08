export declare class Database {
    private static instance;
    private constructor();
    static getInstance(): Database;
    connectMongo(): Promise<void>;
    disconnectMongo(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=database.d.ts.map