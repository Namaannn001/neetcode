import mongoose, { Schema, Document } from 'mongoose';

export interface IPremiumProblem extends Document {
  title: string;
  slug: string; // URL-friendly ID (e.g., "two-sum")
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string; // e.g., "Arrays & Hashing"
  order: number; // To keep them sorted (1, 2, 3...)
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

const PremiumProblemSchema = new Schema<IPremiumProblem>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  category: { type: String, required: true }, // This is key for the accordion grouping
  order: { type: Number, default: 0 },
  videoUrl: { type: String },
  starterCode: [{
    language: { type: String, required: true },
    code: { type: String, required: true }
  }],
  testCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true }
  }]
}, { timestamps: true });

export const PremiumProblem = mongoose.model<IPremiumProblem>('PremiumProblem', PremiumProblemSchema);