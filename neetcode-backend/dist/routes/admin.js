"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const index_2 = require("../logger/index");
const router = (0, express_1.Router)();
router.post('/problems', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { title, description, type, difficulty, tags, timeLimit, memoryLimit, languages } = req.body;
    const problem = new index_1.Problem({
        title,
        description,
        type,
        difficulty,
        tags,
        timeLimit,
        memoryLimit,
        languages,
        createdBy: req.userId,
    });
    await problem.save();
    index_2.logger.info('Problem created', { problemId: problem._id, createdBy: req.userId });
    return res.status(201).json({ problem });
}));
router.patch('/problems/:problemId', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const updates = req.body;
    const problem = await index_1.Problem.findByIdAndUpdate(problemId, { $set: updates }, { new: true, runValidators: true });
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    index_2.logger.info('Problem updated', { problemId, updatedBy: req.userId });
    return res.json({ problem });
}));
router.delete('/problems/:problemId', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const problem = await index_1.Problem.findByIdAndDelete(problemId);
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    await index_1.TestCase.deleteMany({ problemId });
    index_2.logger.info('Problem deleted', { problemId, deletedBy: req.userId });
    return res.json({ message: 'Problem deleted successfully' });
}));
router.post('/problems/:problemId/testcases', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const { testCases } = req.body;
    const problem = await index_1.Problem.findById(problemId);
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    const latestVersion = await index_1.TestCase.findOne({ problemId })
        .sort({ version: -1 })
        .select('version');
    const nextVersion = (latestVersion?.version || 0) + 1;
    const createdTestCases = [];
    for (const testCase of testCases) {
        const newTestCase = new index_1.TestCase({
            problemId,
            version: nextVersion,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isSample: testCase.isSample || false,
        });
        await newTestCase.save();
        createdTestCases.push(newTestCase);
    }
    index_2.logger.info('Test cases created', { problemId, version: nextVersion, count: testCases.length });
    return res.status(201).json({
        testCases: createdTestCases,
        version: nextVersion,
    });
}));
router.patch('/problems/:problemId/testcases', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { problemId } = req.params;
    const { version, testCases } = req.body;
    const problem = await index_1.Problem.findById(problemId);
    if (!problem) {
        return res.status(404).json({ error: 'Problem not found' });
    }
    const existingVersion = await index_1.TestCase.findOne({ problemId, version });
    if (!existingVersion) {
        return res.status(404).json({ error: 'Test case version not found' });
    }
    await index_1.TestCase.deleteMany({ problemId, version });
    const updatedTestCases = [];
    for (const testCase of testCases) {
        const updatedTestCase = new index_1.TestCase({
            problemId,
            version,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isSample: testCase.isSample || false,
        });
        await updatedTestCase.save();
        updatedTestCases.push(updatedTestCase);
    }
    index_2.logger.info('Test cases updated', { problemId, version, count: testCases.length });
    return res.json({
        testCases: updatedTestCases,
        version,
    });
}));
router.post('/mcqs', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { question, language, options, correctAnswer, explanation, tags, difficulty } = req.body;
    const mcq = new index_1.MCQ({
        question,
        language,
        options,
        correctAnswer,
        explanation,
        tags,
        difficulty,
        createdBy: req.userId,
    });
    await mcq.save();
    index_2.logger.info('MCQ created', { mcqId: mcq._id, createdBy: req.userId });
    return res.status(201).json({ mcq });
}));
router.patch('/mcqs/:mcqId', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mcqId } = req.params;
    const updates = req.body;
    const mcq = await index_1.MCQ.findByIdAndUpdate(mcqId, { $set: updates }, { new: true, runValidators: true });
    if (!mcq) {
        return res.status(404).json({ error: 'MCQ not found' });
    }
    index_2.logger.info('MCQ updated', { mcqId, updatedBy: req.userId });
    return res.json({ mcq });
}));
router.delete('/mcqs/:mcqId', auth_1.authMiddleware, auth_1.adminMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { mcqId } = req.params;
    const mcq = await index_1.MCQ.findByIdAndDelete(mcqId);
    if (!mcq) {
        return res.status(404).json({ error: 'MCQ not found' });
    }
    await index_1.Submission.deleteMany({ mcqId });
    index_2.logger.info('MCQ deleted', { mcqId, deletedBy: req.userId });
    return res.json({ message: 'MCQ deleted successfully' });
}));
// router.post(
//   '/rejudge/:submissionId',
//   authMiddleware,
//   adminMiddleware,
//   asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
//     const { submissionId } = req.params as any;
//     const submission = await Submission.findById(submissionId);
//     if (!submission) {
//       res.status(404).json({ error: 'Submission not found' });
//       return;
//     }
//     if (!submission.problemId) {
//       res.status(400).json({ error: 'Can only rejudge code submissions' });
//       return;
//     }
//     if (!submission.code || !submission.language) {
//       res.status(400).json({ error: 'Cannot rejudge this submission' });
//       return;
//     }
//     submission.status = 'pending';
//     await submission.save();
//     processRejudge(submissionId, submission.problemId.toString(), submission.code, submission.language).catch(error => {
//       logger.error('Failed to process rejudge:', error);
//     });
//     logger.info('Submission queued for rejudge', { submissionId, judgeBy: req.userId });
//     return res.json({ message: 'Submission queued for rejudge' });
//   })
// );
// async function processRejudge(
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
//     submission.status = 'running';
//     await submission.save();
//     if (testCases.length === 0) {
//       submission.status = 'runtime_error';
//       submission.completedAt = new Date();
//       await submission.save();
//       return;
//     }
//     let allPassed = true;
//     let passedCount = 0;
//     for (const testCase of testCases) {
//       const response = await judge0Service.execute({
//         source_code: code,
//         language_id: language as any,
//         stdin: testCase.input,
//         // expected_output: testCase.expectedOutput,
//         // cpu_time_limit: problem.timeLimit,
//         // memory_limit: problem.memoryLimit,
//       });
//       const result = await judge0Service.waitForCompletion(response.token);
//       const ourStatus = judge0Service.judge0StatusToOurStatus(result.status.id);
//       if (ourStatus !== 'accepted') {
//         allPassed = false;
//         break;
//       }
//       passedCount++;
//     }
//     submission.status = allPassed ? 'accepted' : 'wrong_answer';
//     submission.testCasesPassed = passedCount;
//     submission.totalTestCases = testCases.length;
//     submission.completedAt = new Date();
//     const oldScore = submission.score;
//     submission.score = 0;
//     if (allPassed && problem.type === 'dsa') {
//       submission.score = getScoreForDifficulty(problem.difficulty);
//     }
//     await submission.save();
//     if (oldScore !== submission.score) {
//       await leaderboardService.rebuildLeaderboard();
//     }
//   } catch (error) {
//     logger.error('Error processing rejudge:', error);
//     const submission = await Submission.findById(submissionId);
//     if (submission) {
//       submission.status = 'runtime_error';
//       submission.completedAt = new Date();
//       await submission.save();
//     }
//   }
// }
function getScoreForDifficulty(difficulty) {
    const scores = {
        easy: 20,
        medium: 30,
        hard: 50,
    };
    return scores[difficulty || 'easy'] || 0;
}
exports.default = router;
