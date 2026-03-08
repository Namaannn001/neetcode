export interface ExecuteRequest {
    source_code: string;
    language_id: number;
    stdin?: string;
}
export interface ExecuteResponse {
    token: string;
}
export interface SubmissionResult {
    token: string;
    status: {
        id: number;
        description: string;
    };
    stdout?: string;
    stderr?: string;
    compile_output?: string;
    time?: number;
    memory?: number;
    exit_code?: number;
}
export declare class Judge0Service {
    private client;
    constructor();
    execute(request: ExecuteRequest): Promise<ExecuteResponse>;
    getSubmissionStatus(token: string): Promise<SubmissionResult>;
    waitForCompletion(token: string, onProgress?: (status: SubmissionResult) => void): Promise<SubmissionResult>;
    judge0StatusToOurStatus(judge0StatusId: number): string;
}
export declare const judge0Service: Judge0Service;
//# sourceMappingURL=executionService.d.ts.map