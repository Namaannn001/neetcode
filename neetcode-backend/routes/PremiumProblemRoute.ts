import { Router, Response } from 'express';
import { PremiumProblem, Submission } from '../models/index';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/premium/roadmap
router.get('/roadmap', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // 1. Fetch all premium problems sorted by their order
  const problems = await PremiumProblem.find().sort({ order: 1 }).lean();

  // 2. Fetch all successful submissions for this user to check progress
  // We filter by 'premium' type if you distinguish them, or just match by problemId if shared
  const solvedSubmissions = await Submission.find({
    userId: req.user._id,
    status: 'accepted'
  }).select('problemId').lean();

  const solvedSet = new Set(solvedSubmissions.map(s => s.problemId.toString()));

  // 3. Group by Category
  // Structure: { "Arrays": { total: 10, solved: 2, problems: [...] }, ... }
  const roadmap: Record<string, any> = {};

  problems.forEach((prob: any) => {
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
    if (isSolved) roadmap[cat].solvedCount++;

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
router.get('/problem/:slug', authMiddleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const problem = await PremiumProblem.findOne({ slug: req.params.slug });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    return res.json({ problem });
}));

export default router;