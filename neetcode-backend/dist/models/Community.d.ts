import mongoose from 'mongoose';
export declare const Community: mongoose.Model<{
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps, {}, {}, {}, mongoose.Document<unknown, {}, {
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps>, {}, mongoose.ResolveSchemaOptions<{
    timestamps: true;
}>> & mongoose.FlatRecord<{
    type: "open" | "domain_restricted";
    name: string;
    description: string;
    ownerId: mongoose.Types.ObjectId;
    memberCount: number;
    domain?: string;
} & mongoose.DefaultTimestampProps> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=Community.d.ts.map