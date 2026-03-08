import mongoose from 'mongoose';
export declare const CommunityMember: mongoose.Model<{
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    role: "admin" | "owner" | "member";
    userId: mongoose.Types.ObjectId;
    communityId: mongoose.Types.ObjectId;
    joinedAt: NativeDate;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=CommunityMember.d.ts.map