"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }
    format(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level}] ${message}${metaStr}`;
    }
    info(message, meta) {
        if (this.isDevelopment) {
            console.log(this.format('INFO', message, meta));
        }
    }
    error(message, error) {
        const meta = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error;
        console.error(this.format('ERROR', message, meta));
    }
    warn(message, meta) {
        if (this.isDevelopment) {
            console.warn(this.format('WARN', message, meta));
        }
    }
    debug(message, meta) {
        if (this.isDevelopment) {
            console.debug(this.format('DEBUG', message, meta));
        }
    }
}
exports.logger = new Logger();
