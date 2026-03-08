import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    firebaseUid: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firebaseUid?: string;
    email?: string;
    displayName?: string;
}, {
    firebaseUid?: string;
    email?: string;
    displayName?: string;
}>;
export declare const loginSchema: z.ZodObject<{
    idToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    idToken?: string;
}, {
    idToken?: string;
}>;
export declare const createCommunitySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["open", "domain_restricted"]>;
    domain: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "open" | "domain_restricted";
    name?: string;
    description?: string;
    domain?: string;
}, {
    type?: "open" | "domain_restricted";
    name?: string;
    description?: string;
    domain?: string;
}>;
export declare const updateCommunitySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
}, {
    name?: string;
    description?: string;
}>;
export declare const submitMCQSchema: z.ZodObject<{
    mcqId: z.ZodString;
    answer: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    mcqId?: string;
    answer?: number;
}, {
    mcqId?: string;
    answer?: number;
}>;
export declare const submitCodeSchema: z.ZodObject<{
    problemId: z.ZodString;
    code: z.ZodString;
    language: z.ZodString;
}, "strip", z.ZodTypeAny, {
    problemId?: string;
    language?: string;
    code?: string;
}, {
    problemId?: string;
    language?: string;
    code?: string;
}>;
export declare const createProblemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["dsa", "practice"]>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    timeLimit: z.ZodDefault<z.ZodNumber>;
    memoryLimit: z.ZodDefault<z.ZodNumber>;
    languages: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type?: "dsa" | "practice";
    description?: string;
    title?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    timeLimit?: number;
    memoryLimit?: number;
    languages?: string[];
}, {
    type?: "dsa" | "practice";
    description?: string;
    title?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    timeLimit?: number;
    memoryLimit?: number;
    languages?: string[];
}>;
export declare const updateProblemSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeLimit: z.ZodOptional<z.ZodNumber>;
    memoryLimit: z.ZodOptional<z.ZodNumber>;
    languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    title?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    timeLimit?: number;
    memoryLimit?: number;
    languages?: string[];
}, {
    description?: string;
    title?: string;
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    timeLimit?: number;
    memoryLimit?: number;
    languages?: string[];
}>;
export declare const createTestCasesSchema: z.ZodObject<{
    testCases: z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        isSample: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }, {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    testCases?: {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }[];
}, {
    testCases?: {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }[];
}>;
export declare const updateTestCasesSchema: z.ZodObject<{
    version: z.ZodNumber;
    testCases: z.ZodArray<z.ZodObject<{
        input: z.ZodString;
        expectedOutput: z.ZodString;
        isSample: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }, {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    version?: number;
    testCases?: {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }[];
}, {
    version?: number;
    testCases?: {
        input?: string;
        expectedOutput?: string;
        isSample?: boolean;
    }[];
}>;
export declare const createMCQSchema: z.ZodObject<{
    question: z.ZodString;
    language: z.ZodString;
    options: z.ZodArray<z.ZodString, "many">;
    correctAnswer: z.ZodNumber;
    explanation: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
}, "strip", z.ZodTypeAny, {
    options?: string[];
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    question?: string;
    language?: string;
    correctAnswer?: number;
    explanation?: string;
}, {
    options?: string[];
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    question?: string;
    language?: string;
    correctAnswer?: number;
    explanation?: string;
}>;
export declare const updateMCQSchema: z.ZodObject<{
    question: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    correctAnswer: z.ZodOptional<z.ZodNumber>;
    explanation: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
}, "strip", z.ZodTypeAny, {
    options?: string[];
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    question?: string;
    language?: string;
    correctAnswer?: number;
    explanation?: string;
}, {
    options?: string[];
    difficulty?: "easy" | "medium" | "hard";
    tags?: string[];
    question?: string;
    language?: string;
    correctAnswer?: number;
    explanation?: string;
}>;
export declare function validateRequest(schema: z.ZodSchema): (req: any, res: any, next: any) => void;
//# sourceMappingURL=validators.d.ts.map