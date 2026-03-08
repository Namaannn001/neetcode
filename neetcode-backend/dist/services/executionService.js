"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.judge0Service = exports.Judge0Service = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("../config/index");
const index_2 = require("../logger/index");
class Judge0Service {
    constructor() {
        this.client = axios_1.default.create({
            baseURL: index_1.config.judge0.apiUrl,
            headers: {
                "Content-Type": "application/json",
            },
            params: {
                base64_encoded: false,
                wait: false,
            },
        });
        // if (config.judge0.apiKey) {
        //   this.client.defaults.headers['X-Auth-Token'] = config.judge0.apiKey;
        // }
    }
    // private getLanguageId(language: string): number {
    //   const languageMap: { [key: string]: number } = {
    //     javascript: 63,
    //     python: 71,
    //     python3: 71,
    //     java: 62,
    //     c: 11,
    //     cpp: 54,
    //     csharp: 51,
    //     go: 60,
    //     rust: 73,
    //     ruby: 72,
    //     php: 68,
    //     swift: 83,
    //     kotlin: 79,
    //     typescript: 74,
    //   };
    //   const languageId = languageMap[language.toLowerCase()];
    //   if (!languageId) {
    //     throw new Error(`Unsupported language: ${language}`);
    //   }
    //   return languageId;
    // }
    // public async execute(request: ExecuteRequest): Promise<ExecuteResponse> {
    //   try {
    //     const languageId = this.getLanguageId(request.language_id as any);
    //     const payload: any = {
    //       source_code: request.source_code,
    //       language_id: languageId,
    //     };
    //     if (request.stdin) {
    //       payload.stdin = request.stdin;
    //     }
    //     if (request.expected_output) {
    //       payload.expected_output = request.expected_output;
    //     }
    //     if (request.cpu_time_limit) {
    //       payload.cpu_time_limit = request.cpu_time_limit;
    //     }
    //     if (request.memory_limit) {
    //       payload.memory_limit = request.memory_limit * 1024 * 1024; // Convert to bytes
    //     }
    //     const response = await this.client.post('/submissions', payload);
    //     logger.info('Judge0 submission created', { token: response.data.token });
    //     return response.data;
    //   } catch (error) {
    //     logger.error('Judge0 execution failed:', error);
    //     throw new Error('Failed to submit code for execution');
    //   }
    // }
    async execute(request) {
        try {
            const payload = {
                source_code: request.source_code,
                language_id: request.language_id,
                stdin: request.stdin,
            };
            index_2.logger.info("Judge0 payload", payload);
            const response = await this.client.post("/submissions", payload);
            index_2.logger.info("Judge0 submission created", {
                token: response.data.token,
            });
            return response.data;
        }
        catch (error) {
            index_2.logger.error("Judge0 execution failed", {
                response: error.response?.data,
                message: error.message,
            });
            throw new Error("Failed to submit code for execution");
        }
    }
    // public async getSubmissionStatus(token: string): Promise<SubmissionResult> {
    //   try {
    //     const response = await this.client.get(`/submissions/${token}`);
    //     return response.data;
    //   } catch (error) {
    //     logger.error("Failed to get submission status:", error);
    //     throw new Error("Failed to get submission status");
    //   }
    // }
    //   public async getSubmissionStatus(token: string): Promise<SubmissionResult> {
    //   try {
    //     const response = await this.client.get(
    //       `/submissions/${token}`,
    //       {
    //         params: {
    //           base64_encoded: false,
    //           fields: "*",
    //         },
    //       }
    //     );
    //     return response.data;
    //   } catch (error) {
    //     logger.error("Failed to get submission status:", error);
    //     throw new Error("Failed to get submission status");
    //   }
    // }
    async getSubmissionStatus(token) {
        try {
            const response = await this.client.get(`/submissions/${token}`, {
                params: {
                    base64_encoded: false,
                    fields: "*",
                },
            });
            return response.data;
        }
        catch (error) {
            index_2.logger.error("Failed to get submission status:", error);
            throw new Error("Failed to get submission status");
        }
    }
    async waitForCompletion(token, onProgress) {
        let attempts = 0;
        const maxAttempts = index_1.config.judge0.maxPollingAttempts;
        const pollingInterval = index_1.config.judge0.pollingInterval;
        while (attempts < maxAttempts) {
            const result = await this.getSubmissionStatus(token);
            if (onProgress) {
                onProgress(result);
            }
            if ([1, 2].includes(result.status.id)) {
                await new Promise((resolve) => setTimeout(resolve, pollingInterval));
                attempts++;
            }
            else {
                return result;
            }
        }
        throw new Error("Submission timeout");
    }
    judge0StatusToOurStatus(judge0StatusId) {
        const statusMap = {
            1: "pending",
            2: "running",
            3: "accepted",
            4: "wrong_answer",
            5: "time_limit_exceeded",
            6: "compile_error",
            7: "runtime_error",
            8: "memory_limit_exceeded",
            9: "runtime_error",
            10: "runtime_error",
            11: "compile_error",
            12: "runtime_error",
        };
        return statusMap[judge0StatusId] || "runtime_error";
    }
}
exports.Judge0Service = Judge0Service;
exports.judge0Service = new Judge0Service();
