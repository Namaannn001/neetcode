import mongoose from 'mongoose';
export declare const Problem: mongoose.Model<{
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "dsa" | "practice";
    description: string;
    title: string;
    tags: string[];
    timeLimit: number;
    memoryLimit: number;
    languages: string[];
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=Problem.d.ts.map