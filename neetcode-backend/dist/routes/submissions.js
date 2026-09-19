"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const executionService_1 = require("../services/executionService");
const leaderboardService_1 = require("../services/leaderboardService");
const errorHandler_1 = require("../middleware/errorHandler");
const index_2 = require("../logger/index");
const Judge0LangMap_1 = require("../services/Judge0LangMap");
const router = (0, express_1.Router)();
function normalize(output) {
    return output.trim().replace(/\r\n/g, "\n").replace(/\s+/g, " ");
}
router.post("/", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId, code, language, mcqId, answer } = req.body;
    if (mcqId) {
        const mcq = await index_1.MCQ.findById(mcqId);
        if (!mcq) {
            res.status(404).json({ error: "MCQ not found" });
            return;
        }
        const isCorrect = answer === mcq.correctAnswer;
        const submission = new index_1.Submission({
            userId: req.userId,
            mcqId,
            answer,
            status: isCorrect ? "accepted" : "wrong_answer",
            completedAt: new Date(),
        });
        await submission.save();
        res.status(201).json({ submission });
        return;
    }
    if (!problemId || !code || !language) {
        res
            .status(400)
            .json({ error: "problemId, code, and language are required" });
        return;
    }
    const problem = await index_1.Problem.findById(problemId);
    if (!problem) {
        res.status(404).json({ error: "Problem not found" });
        return;
    }
    const submission = new index_1.Submission({
        userId: req.userId,
        problemId,
        code,
        language,
        status: "pending",
    });
    await submission.save();
    res.status(201).json({ submission });
    processSubmission(submission._id.toString(), problemId, code, language).catch((error) => {
        index_2.logger.error("Failed to process submission:", error);
    });
}));
// async function processSubmission(
//   submissionId: string,
//   problemId: string,
//   code: string,
//   language: string
// ): Promise<void> {
//   try {
//     const submission = await Submission.findById(submissionId);
//     if (!submission) return;
//     const problem = await Problem.findById(problemId);
//     if (!problem) return;
//     const testCases = await TestCase.find({ problemId, isSample: false });
//     submission.status = "running";
//     await submission.save();
//     if (testCases.length === 0) {
//       submission.status = "runtime_error";
//       submission.completedAt = new Date();
//       await submission.save();
//       return;
//     }
//     let allPassed = true;
//     let passedCount = 0;
//     const results = [];
//     for (const testCase of testCases) {
//       const response = await judge0Service.execute({
//         source_code: code,
//         language_id: language as any,
//         stdin: testCase.input,
//         expected_output: testCase.expectedOutput,
//         cpu_time_limit: problem.timeLimit,
//         memory_limit: problem.memoryLimit,
//       });
//       const result = await judge0Service.waitForCompletion(response.token);
//       const ourStatus = judge0Service.judge0StatusToOurStatus(result.status.id);
//       if (ourStatus !== "accepted") {
//         allPassed = false;
//         results.push({
//           testCaseId: testCase._id,
//           status: ourStatus,
//           time: result.time,
//           memory: result.memory,
//         });
//         break;
//       }
//       passedCount++;
//       results.push({
//         testCaseId: testCase._id,
//         status: "accepted",
//         time: result.time,
//         memory: result.memory,
//       });
//     }
//     submission.status = allPassed ? "accepted" : "wrong_answer";
//     submission.testCasesPassed = passedCount;
//     submission.totalTestCases = testCases.length;
//     submission.completedAt = new Date();
//     if (allPassed && problem.type === "dsa") {
//       submission.score = getScoreForDifficulty(problem.difficulty);
//       await leaderboardService.updateScore(
//         submission.userId.toString(),
//         problemId,
//         problem.difficulty || "easy"
//       );
//     }
//     await submission.save();
//   } catch (error) {
//     logger.error("Error processing submission:", error);
//     const submission = await Submission.findById(submissionId);
//     if (submission) {
//       submission.status = "runtime_error";
//       submission.completedAt = new Date();
//       await submission.save();
//     }
//   }
// }
async function processSubmission(submissionId, problemId, code, language) {
    const submission = await index_1.Submission.findById(submissionId);
    if (!submission)
        return;
    try {
        const problem = await index_1.Problem.findById(problemId);
        if (!problem)
            throw new Error("Problem not found");
        // ✅ correct field
        const testCases = await index_1.TestCase.find({ problemId });
        if (testCases.length === 0) {
            submission.status = "runtime_error";
            submission.completedAt = new Date();
            await submission.save();
            return;
        }
        submission.status = "running";
        await submission.save();
        const normalizedLanguage = language.trim().toLowerCase();
        const languageId = Judge0LangMap_1.JUDGE0_LANGUAGE_MAP[normalizedLanguage];
        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }
        let passed = 0;
        let failedTestCase = null;
        for (const testCase of testCases) {
            const exec = await executionService_1.judge0Service.execute({
                source_code: code,
                language_id: languageId,
                stdin: testCase.input,
            });
            const result = await executionService_1.judge0Service.waitForCompletion(exec.token);
            if (result.status.id !== 3) {
                // 3 = Accepted
                failedTestCase = {
                    input: testCase.input,
                    expected: testCase.expectedOutput,
                    output: result.stdout ?? result.stderr ?? undefined,
                };
                break;
            }
            const userOutput = normalize(result.stdout || "");
            const expectedOutput = normalize(testCase.expectedOutput);
            if (userOutput !== expectedOutput) {
                failedTestCase = {
                    input: testCase.input,
                    expected: expectedOutput,
                    output: userOutput,
                };
                break;
            }
            passed++;
        }
        const total = testCases.length;
        const allPassed = passed === total;
        submission.status = allPassed ? "accepted" : "wrong_answer";
        submission.testCasesPassed = passed;
        submission.totalTestCases = total;
        submission.completedAt = new Date();
        if (allPassed && problem.type === "dsa") {
            submission.score = getScoreForDifficulty(problem.difficulty ?? undefined);
            await leaderboardService_1.leaderboardService.updateScore(submission.userId.toString(), problemId, problem.difficulty ?? "easy");
        }
        // optional but VERY useful
        if (failedTestCase) {
            submission.failureDetails = failedTestCase;
        }
        await submission.save();
    }
    catch (err) {
        index_2.logger.error("Error processing submission:", err);
        submission.status = "runtime_error";
        submission.completedAt = new Date();
        await submission.save();
    }
}
function getScoreForDifficulty(difficulty) {
    const scores = {
        easy: 20,
        medium: 30,
        hard: 50,
    };
    return scores[difficulty || "easy"] || 0;
}
router.get("/:submissionId", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { submissionId } = req.params;
    const submission = await index_1.Submission.findById(submissionId)
        .populate("userId", "displayName email")
        .populate("problemId", "title type difficulty")
        .populate("mcqId", "question language");
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    if (submission.userId._id.toString() !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
    }
    return res.json({ submission });
}));
router.get("/me", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 20, offset = 0, type } = req.query;
    const filter = { userId: req.userId };
    if (type === "dsa") {
        filter.problemId = { $exists: true };
    }
    else if (type === "practice") {
        filter.problemId = { $exists: true };
    }
    else if (type === "mcq") {
        filter.mcqId = { $exists: true };
    }
    const submissions = await index_1.Submission.find(filter)
        .populate("problemId", "title type difficulty")
        .populate("mcqId", "question language")
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const total = await index_1.Submission.countDocuments(filter);
    return res.json({
        submissions,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.get("/me/dsa", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const submissions = await index_1.Submission.find({
        userId: req.userId,
        problemId: { $exists: true },
    })
        .populate({
        path: "problemId",
        match: { type: "dsa" },
        select: "title difficulty",
    })
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const filteredSubmissions = submissions.filter((s) => s.problemId);
    const total = await index_1.Submission.countDocuments({
        userId: req.userId,
        problemId: { $exists: true },
    });
    return res.json({
        submissions: filteredSubmissions,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.get("/me/practice", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const submissions = await index_1.Submission.find({
        userId: req.userId,
        problemId: { $exists: true },
    })
        .populate({
        path: "problemId",
        match: { type: "practice" },
        select: "title",
    })
        .sort({ createdAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit));
    const filteredSubmissions = submissions.filter((s) => s.problemId);
    const total = await index_1.Submission.countDocuments({
        userId: req.userId,
        problemId: { $exists: true },
    });
    return res.json({
        submissions: filteredSubmissions,
        pagination: {
            total,
            offset: Number(offset),
            limit: Number(limit),
        },
    });
}));
router.post("/:submissionId/retry", auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { submissionId } = req.params;
    const submission = await index_1.Submission.findById(submissionId);
    if (!submission) {
        return res.status(404).json({ error: "Submission not found" });
    }
    if (submission.userId.toString() !== req.userId) {
        return res.status(403).json({ error: "Access denied" });
    }
    if (!submission.problemId) {
        return res.status(400).json({ error: "Can only retry code submissions" });
    }
    if (!submission.code || !submission.language) {
        return res.status(400).json({ error: "Cannot retry this submission" });
    }
    submission.status = "pending";
    await submission.save();
    processSubmission(submission._id.toString(), submission.problemId.toString(), submission.code, submission.language).catch((error) => {
        index_2.logger.error("Failed to process retry:", error);
    });
    return res.json({ message: "Submission queued for retry" });
}));
exports.default = router;
