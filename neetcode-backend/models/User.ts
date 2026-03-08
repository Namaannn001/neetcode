import mongoose, { Document, Schema } from 'mongoose';

// 1. Define the TypeScript Interface
export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  username: string;        // New: Unique handle (@john_doe)
  displayName?: string;
  avatarUrl?: string;      // New: Profile picture URL
  bio?: string;           // New: Short description
  role: 'admin' | 'user';
  
  // New: Social Media Links for the Profile Card
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };

  // New: User Settings
  preferences?: {
    isProfilePublic: boolean;
    theme?: 'light' | 'dark' | 'system';
  };

  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Schema
const UserSchema = new Schema<IUser>({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // New: Username is crucial for profile URLs (neetcode.com/u/username)
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true, // Allows null/undefined for existing users (prevents duplicate null error)
  },
  displayName: {
    type: String,
    trim: true,
  },
  avatarUrl: {
    type: String,
    default: "", // Can use a placeholder image URL here later
  },
  bio: {
    type: String,
    maxlength: 250, // Keep it short for UI design
    default: "",
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  // New: Nested Object for Socials
  socialLinks: {
    github: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    website: { type: String, trim: true },
    twitter: { type: String, trim: true },
  },
  // New: Preferences
  preferences: {
    isProfilePublic: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
  },
}, {
  timestamps: true,
});

// Create and Export the Model
export const User = mongoose.model<IUser>('User', UserSchema);