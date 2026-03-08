import mongoose from 'mongoose';
export declare const TestCase: mongoose.Model<{
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    version: number;
    problemId: mongoose.Types.ObjectId;
    expectedOutput: string;
    isSample: boolean;
    input?: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=TestCase.d.ts.map