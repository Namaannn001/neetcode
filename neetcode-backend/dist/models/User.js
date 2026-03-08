"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// 2. Define the Schema
const UserSchema = new mongoose_1.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    // New: Username is crucial for profile URLs (neetcode.com/u/username)
    username: {
        type: String,
        unique: true,
        trim: true,
        sparse: true, // Allows null/undefined for existing users (prevents duplicate null error)
    },
    displayName: {
        type: String,
        trim: true,
    },
    avatarUrl: {
        type: String,
        default: "", // Can use a placeholder image URL here later
    },
    bio: {
        type: String,
        maxlength: 250, // Keep it short for UI design
        default: "",
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    // New: Nested Object for Socials
    socialLinks: {
        github: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        website: { type: String, trim: true },
        twitter: { type: String, trim: true },
    },
    // New: Preferences
    preferences: {
        isProfilePublic: { type: Boolean, default: true },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    },
}, {
    timestamps: true,
});
// Create and Export the Model
exports.User = mongoose_1.default.model('User', UserSchema);
