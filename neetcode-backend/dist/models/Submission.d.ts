import mongoose from 'mongoose';
export declare const Submission: mongoose.Model<{
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    score: number;
    userId: mongoose.Types.ObjectId;
    status: "pending" | "running" | "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded" | "compile_error" | "runtime_error";
    testCasesPassed: number;
    totalTestCases: number;
    problemId?: mongoose.Types.ObjectId;
    language?: string;
    mcqId?: mongoose.Types.ObjectId;
    code?: string;
    answer?: number;
    executionTime?: number;
    memoryUsed?: number;
    completedAt?: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=Submission.d.ts.map