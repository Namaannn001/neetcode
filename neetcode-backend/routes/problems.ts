import { Router, Response } from 'express';
import { Problem, TestCase } from '../models/index';
import { AuthenticatedRequest } from '../types/index';
import { authMiddleware } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Query parameter examples:
// GET /problems?type=dsa
// GET /problems?difficulty=easy
// Both are handled by this route

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, difficulty, tags, search, limit = 50, offset = 0 } = req.query;

    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : (tags as string).split(',');
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const problems = await Problem.find(filter)
      .populate('createdBy', 'displayName')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await Problem.countDocuments(filter);

    return res.json({
      problems,
      pagination: {
        total,
        offset: Number(offset),
        limit: Number(limit),
      },
    });
  })
);

router.get(
  '/:problemId',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { problemId } = req.params;

    const problem = await Problem.findById(problemId).populate('createdBy', 'displayName');

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
      
    }

    const testCases = await TestCase.find({
      problemId,
      isSample: true,
    });

    return res.json({
      problem,
      sampleTestCases: testCases,
    });
  })
);

router.get(
  '/:problemId/languages',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { problemId } = req.params;

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
      
    }

    return res.json({
      languages: problem.languages,
    });
  })
);

router.get(
  '/:problemId/sample-testcases',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { problemId } = req.params;

    const problem = await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
      
    }

    const testCases = await TestCase.find({
      problemId,
      isSample: true,
    });

    return res.json({ testCases });
  })
);

export default router;
