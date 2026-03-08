"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMCQSchema = exports.createMCQSchema = exports.updateTestCasesSchema = exports.createTestCasesSchema = exports.updateProblemSchema = exports.createProblemSchema = exports.submitCodeSchema = exports.submitMCQSchema = exports.updateCommunitySchema = exports.createCommunitySchema = exports.loginSchema = exports.registerSchema = void 0;
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    idToken: zod_1.z.string().min(1),
});
exports.createCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(500),
    type: zod_1.z.enum(['open', 'domain_restricted']),
    domain: zod_1.z.string().email().optional(),
});
exports.updateCommunitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().min(1).max(500).optional(),
});
exports.submitMCQSchema = zod_1.z.object({
    mcqId: zod_1.z.string(),
    answer: zod_1.z.number().min(0),
});
exports.submitCodeSchema = zod_1.z.object({
    problemId: zod_1.z.string(),
    code: zod_1.z.string().min(1),
    language: zod_1.z.string().min(1),
});
exports.createProblemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1),
    type: zod_1.z.enum(['dsa', 'practice']),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    timeLimit: zod_1.z.number().positive().default(1),
    memoryLimit: zod_1.z.number().positive().default(256),
    languages: zod_1.z.array(zod_1.z.string()).min(1),
});
exports.updateProblemSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().min(1).optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    timeLimit: zod_1.z.number().positive().optional(),
    memoryLimit: zod_1.z.number().positive().optional(),
    languages: zod_1.z.array(zod_1.z.string()).min(1).optional(),
});
exports.createTestCasesSchema = zod_1.z.object({
    testCases: zod_1.z.array(zod_1.z.object({
        input: zod_1.z.string(),
        expectedOutput: zod_1.z.string(),
        isSample: zod_1.z.boolean().default(false),
    })).min(1),
});
exports.updateTestCasesSchema = zod_1.z.object({
    version: zod_1.z.number().positive(),
    testCases: zod_1.z.array(zod_1.z.object({
        input: zod_1.z.string(),
        expectedOutput: zod_1.z.string(),
        isSample: zod_1.z.boolean().default(false),
    })).min(1),
});
exports.createMCQSchema = zod_1.z.object({
    question: zod_1.z.string().min(1),
    language: zod_1.z.string().min(1),
    options: zod_1.z.array(zod_1.z.string()).min(2).max(10),
    correctAnswer: zod_1.z.number().min(0),
    explanation: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
});
exports.updateMCQSchema = zod_1.z.object({
    question: zod_1.z.string().min(1).optional(),
    language: zod_1.z.string().min(1).optional(),
    options: zod_1.z.array(zod_1.z.string()).min(2).max(10).optional(),
    correctAnswer: zod_1.z.number().min(0).optional(),
    explanation: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
});
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.errors,
                });
                return;
            }
            res.status(400).json({ error: 'Invalid request data' });
        }
    };
}
