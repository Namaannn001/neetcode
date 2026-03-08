"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const TestCaseSchema = new mongoose_1.default.Schema({
    problemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true,
    },
    version: {
        type: Number,
        required: true,
        default: 1,
    },
    input: {
        type: String,
        // required: true,
    },
    expectedOutput: {
        type: String,
        required: true,
    },
    isSample: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
// TestCaseSchema.index({ problemId: 1, version: 1 });
// TestCaseSchema.index({ problemId: 1, isSample: 1 });
exports.TestCase = mongoose_1.default.model('TestCase', TestCaseSchema);
