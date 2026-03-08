"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCQ = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MCQSchema = new mongoose_1.default.Schema({
    question: {
        type: String,
        required: true,
    },
    language: {
        type: String,
        required: true,
        trim: true,
    },
    options: [{
            type: String,
            required: true,
        }],
    correctAnswer: {
        type: Number,
        required: true,
        min: 0,
    },
    explanation: {
        type: String,
    },
    tags: [{
            type: String,
            trim: true,
        }],
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});
// MCQSchema.index({ language: 1 });
// MCQSchema.index({ difficulty: 1 });
// MCQSchema.index({ tags: 1 });
exports.MCQ = mongoose_1.default.model('MCQ', MCQSchema);
