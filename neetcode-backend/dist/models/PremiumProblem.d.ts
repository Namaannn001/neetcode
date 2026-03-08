import mongoose, { Document } from 'mongoose';
export interface IPremiumProblem extends Document {
    title: string;
    slug: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    order: number;
    videoUrl?: string;
    starterCode: {
        language: string;
        code: string;
    }[];
    testCases: {
        input: string;
        output: string;
    }[];
}
export declare const PremiumProblem: mongoose.Model<IPremiumProblem, {}, {}, {}, mongoose.Document<unknown, {}, IPremiumProblem, {}, {}> & IPremiumProblem & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=PremiumProblem.d.ts.map