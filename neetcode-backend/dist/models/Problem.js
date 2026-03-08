"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Problem = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ProblemSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['dsa', 'practice'],
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: function () {
            return this.type === 'dsa';
        },
    },
    tags: [{
            type: String,
            trim: true,
        }],
    timeLimit: {
        type: Number,
        required: true,
        default: 1,
    },
    memoryLimit: {
        type: Number,
        required: true,
        default: 256,
    },
    languages: [{
            type: String,
            required: true,
        }],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// ProblemSchema.index({ type: 1 });
// ProblemSchema.index({ difficulty: 1 });
// ProblemSchema.index({ tags: 1 });
// ProblemSchema.index({ type: 1, difficulty: 1 });
exports.Problem = mongoose_1.default.model('Problem', ProblemSchema);
