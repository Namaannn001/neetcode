"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Query parameter examples:
// GET /problems?type=dsa
// GET /problems?difficulty=easy
// Both are handled by this route
router.get('/', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type, difficulty, tags, search, limit = 50, offset = 0 } = req.query;
    const filter = {};
    if (type) {
        filter.type = type;
    }
    if (difficulty) {
        filter.difficulty = difficulty;
    }
    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        filter.tags = { $in: tagArray };
    }
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
        ];
    }
    const problems = await index_1.Problem.find(filter)
        .populate('createdBy', 'displayName')
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const total = await index_1.Problem.countDocuments(filter);
    return res.json({
        problems,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.get('/:problemId', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const problem = await index_1.Problem.findById(problemId).populate('createdBy', 'displayName');
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    const testCases = await index_1.TestCase.find({
        problemId,
        isSample: true,
    });
    return res.json({
        problem,
        sampleTestCases: testCases,
    });
}));
router.get('/:problemId/languages', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const problem = await index_1.Problem.findById(problemId);
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    return res.json({
        languages: problem.languages,
    });
}));
router.get('/:problemId/sample-testcases', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const problem = await index_1.Problem.findById(problemId);
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    const testCases = await index_1.TestCase.find({
        problemId,
        isSample: true,
    });
    return res.json({ testCases });
}));
exports.default = router;
