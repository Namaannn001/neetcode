"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Submission = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SubmissionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    problemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Problem',
        index: true,
    },
    mcqId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'MCQ',
        index: true,
    },
    code: {
        type: String,
    },
    language: {
        type: String,
    },
    answer: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'compile_error', 'runtime_error'],
        default: 'pending',
    },
    testCasesPassed: {
        type: Number,
        default: 0,
    },
    totalTestCases: {
        type: Number,
        default: 0,
    },
    executionTime: {
        type: Number,
    },
    memoryUsed: {
        type: Number,
    },
    score: {
        type: Number,
        default: 0,
    },
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// SubmissionSchema.index({ userId: 1, createdAt: -1 });
// SubmissionSchema.index({ problemId: 1 });
// SubmissionSchema.index({ mcqId: 1 });
// SubmissionSchema.index({ status: 1 });
// SubmissionSchema.index({ userId: 1, status: 1 });
exports.Submission = mongoose_1.default.model('Submission', SubmissionSchema);
