"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.get("/", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { language, difficulty, tags, search, limit = 20, offset = 0, } = req.query;
    const filter = {};
    if (language) {
        filter.language = language;
    }
    if (difficulty) {
        filter.difficulty = difficulty;
    }
    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(",");
        filter.tags = { $in: tagArray };
    }
    if (search) {
        filter.question = { $regex: search, $options: "i" };
    }
    const mcqs = await index_1.MCQ.find(filter)
        .populate("createdBy", "displayName")
        .select("-correctAnswer -explanation")
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const total = await index_1.MCQ.countDocuments(filter);
    res.json({
        mcqs,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.get("/:mcqId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mcqId } = req.params;
    const mcq = await index_1.MCQ.findById(mcqId).populate("createdBy", "displayName");
    if (!mcq) {
        res.status(404).json({ error: "MCQ not found" });
        return;
    }
    const previousAttempts = await index_1.Submission.countDocuments({
        userId: req.userId,
        mcqId,
    });
    const hasAttempted = previousAttempts > 0;
    res.json({
        mcq: {
            ...mcq.toObject(),
            correctAnswer: hasAttempted ? mcq.correctAnswer : undefined,
            explanation: hasAttempted ? mcq.explanation : undefined,
        },
    });
}));
router.post("/submit", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mcqId, answer } = req.body;
    const mcq = await index_1.MCQ.findById(mcqId);
    if (!mcq) {
        return res.status(404).json({ error: "MCQ not found" });
    }
    const isCorrect = answer == mcq.correctAnswer;
    const submission = new index_1.Submission({
        userId: req.userId,
        mcqId,
        answer,
        status: isCorrect ? "accepted" : "wrong_answer",
        completedAt: new Date(),
    });
    await submission.save();
    return res.json({
        submission: {
            id: submission._id,
            status: submission.status,
            correctAnswer: mcq.correctAnswer, // ✅ ADD THIS
            explanation: mcq.explanation, // ✅ ALWAYS send explanation (optional but better UX)
            isCorrect,
        },
    });
}));
router.get("/me/attempts", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const submissions = await index_1.Submission.find({
        userId: req.userId,
        mcqId: { $exists: true },
    })
        .populate("mcqId", "question language")
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const total = await index_1.Submission.countDocuments({
        userId: req.userId,
        mcqId: { $exists: true },
    });
    res.json({
        submissions,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.get("/stats", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { userId = req.userId } = req.query;
    const totalAttempts = await index_1.Submission.countDocuments({
        userId,
        mcqId: { $exists: true },
    });
    const correctAttempts = await index_1.Submission.countDocuments({
        userId,
        mcqId: { $exists: true },
        status: "accepted",
    });
    const uniqueMCQsAttempted = await index_1.Submission.distinct("mcqId", {
        userId,
        mcqId: { $exists: true },
    });
    const languageStats = await index_1.Submission.aggregate([
        {
            $match: {
                userId: userId,
                mcqId: { $exists: true },
            },
        },
        {
            $lookup: {
                from: "mcqs",
                localField: "mcqId",
                foreignField: "_id",
                as: "mcq",
            },
        },
        {
            $unwind: "$mcq",
        },
        {
            $group: {
                _id: "$mcq.language",
                attempts: { $sum: 1 },
                correct: {
                    $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
                },
            },
        },
    ]);
    res.json({
        stats: {
            totalAttempts,
            correctAttempts,
            accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
            uniqueMCQsAttempted: uniqueMCQsAttempted.length,
            byLanguage: languageStats,
        },
    });
}));
exports.default = router;
