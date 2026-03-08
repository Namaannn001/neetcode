import mongoose from 'mongoose';
export declare const MCQ: mongoose.Model<{
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    options: string[];
    tags: string[];
    question: string;
    language: string;
    correctAnswer: number;
    difficulty?: "easy" | "medium" | "hard";
    createdBy?: mongoose.Types.ObjectId;
    explanation?: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=MCQ.d.ts.map