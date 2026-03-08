declare class Logger {
    private isDevelopment;
    constructor();
    private format;
    info(message: string, meta?: any): void;
    error(message: string, error?: Error | any): void;
    warn(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=index.d.ts.map