"use strict";
// import mongoose from 'mongoose';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityMember = void 0;
// const CommunityMemberSchema = new mongoose.Schema({
//   communityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Community',
//     required: true,
//     index: true,
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     index: true,
//   },
//   role: {
//     type: String,
//     enum: ['owner', 'admin', 'member'],
//     default: 'member',
//   },
//   joinedAt: {
//     type: Date,
//     default: Date.now,
//   },
// }, {
//   timestamps: true,
// });
// // CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
// // CommunityMemberSchema.index({ userId: 1 });
// // CommunityMemberSchema.index({ communityId: 1 });
// export const CommunityMember = mongoose.model('CommunityMember', CommunityMemberSchema);
const mongoose_1 = __importDefault(require("mongoose"));
const CommunityMemberSchema = new mongoose_1.default.Schema({
    communityId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Community',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member'],
        default: 'member',
    },
    joinedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Ensure a user can't join the same community twice
CommunityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
exports.CommunityMember = mongoose_1.default.model('CommunityMember', CommunityMemberSchema);
