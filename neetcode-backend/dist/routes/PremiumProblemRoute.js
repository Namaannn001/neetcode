"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../models/index");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// GET /api/premium/roadmap
router.get('/roadmap', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    // 1. Fetch all premium problems sorted by their order
    const problems = await index_1.PremiumProblem.find().sort({ order: 1 }).lean();
    // 2. Fetch all successful submissions for this user to check progress
    // We filter by 'premium' type if you distinguish them, or just match by problemId if shared
    const solvedSubmissions = await index_1.Submission.find({
        userId: req.user._id,
        status: 'accepted'
    }).select('problemId').lean();
    const solvedSet = new Set(solvedSubmissions.flatMap((submission) => submission.problemId ? [submission.problemId.toString()] : []));
    // 3. Group by Category
    // Structure: { "Arrays": { total: 10, solved: 2, problems: [...] }, ... }
    const roadmap = {};
    problems.forEach((prob) => {
        const cat = prob.category;
        if (!roadmap[cat]) {
            roadmap[cat] = {
                title: cat,
                total: 0,
                solvedCount: 0,
                problems: []
            };
        }
        const isSolved = solvedSet.has(prob._id.toString());
        roadmap[cat].total++;
        if (isSolved)
            roadmap[cat].solvedCount++;
        roadmap[cat].problems.push({
            _id: prob._id,
            id: prob.slug,
            title: prob.title,
            difficulty: prob.difficulty,
            isSolved
        });
    });
    // Convert object to array for frontend mapping
    const responseData = Object.values(roadmap);
    return res.json({ roadmap: responseData });
}));
// GET /api/premium/problem/:slug (For the ID page later)
router.get('/problem/:slug', auth_1.authMiddleware, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const problem = await index_1.PremiumProblem.findOne({ slug: req.params.slug });
    if (!problem)
        return res.status(404).json({ error: 'Problem not found' });
    return res.json({ problem });
}));
exports.default = router;
