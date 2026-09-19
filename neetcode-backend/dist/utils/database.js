"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.Database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../config/index");
const index_2 = require("../logger/index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Database {
    constructor() { }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connectMongo() {
        try {
            if (!index_1.config.mongodb.uri) {
                throw new Error('MONGODB_URI is not configured');
            }
            await mongoose_1.default.connect(index_1.config.mongodb.uri, {
                dbName: index_1.config.mongodb.database,
            });
            index_2.logger.info('MongoDB connected successfully');
            mongoose_1.default.connection.on('error', (error) => {
                index_2.logger.error('MongoDB connection error:', error);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                index_2.logger.warn('MongoDB disconnected');
            });
            mongoose_1.default.connection.on('reconnected', () => {
                index_2.logger.info('MongoDB reconnected');
            });
        }
        catch (error) {
            index_2.logger.error('MongoDB connection failed:', error);
            throw error;
        }
    }
    async disconnectMongo() {
        try {
            await mongoose_1.default.connection.close();
            index_2.logger.info('MongoDB disconnected');
        }
        catch (error) {
            index_2.logger.error('MongoDB disconnection failed:', error);
            throw error;
        }
    }
}
exports.Database = Database;
exports.database = Database.getInstance();
