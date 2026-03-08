"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const executionService_1 = require("../services/executionService");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/execute', auth_1.authMiddleware, 
// adminMiddleware,
rateLimiter_1.strictRateLimiter, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { source_code, language_id, stdin, expected_output, cpu_time_limit, memory_limit } = req.body;
    if (!source_code || !language_id) {
        return res.status(400).json({ error: 'source_code and language_id are required' });
    }
    const response = await executionService_1.judge0Service.execute({
        source_code,
        language_id,
        stdin,
        // expected_output,
    });
    return res.json({ token: response.token });
}));
router.get('/execute/:token/status', auth_1.authMiddleware, 
// adminMiddleware,
(0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { token } = req.params;
    const result = await executionService_1.judge0Service.getSubmissionStatus(token);
    return res.json({
        token: result.token,
        status: {
            id: result.status.id,
            description: result.status.description,
        },
        stdout: result.stdout,
        stderr: result.stderr,
        compile_output: result.compile_output,
        time: result.time,
        memory: result.memory,
        exit_code: result.exit_code,
    });
}));
exports.default = router;
