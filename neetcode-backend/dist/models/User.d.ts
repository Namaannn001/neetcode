import mongoose, { Document } from 'mongoose';
export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    role: 'admin' | 'user';
    socialLinks?: {
        github?: string;
        linkedin?: string;
        website?: string;
        twitter?: string;
    };
    preferences?: {
        isProfilePublic: boolean;
        theme?: 'light' | 'dark' | 'system';
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map