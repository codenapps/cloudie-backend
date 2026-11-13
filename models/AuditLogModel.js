import mongoose from "mongoose";

const fingerprintSchema = new mongoose.Schema(
    {
        ip: String,
        ipChain: [String],
        userAgent: String,
        acceptLanguage: String,
        origin: String,
        referer: String,
        clientId: String,
        platform: String,
        appVersion: String,
        deviceModel: String,
        osVersion: String,
        fingerprintHash: String,
    },
    { _id: false }
);

const actorSchema = new mongoose.Schema(
    {
        _id: { type: String, default: null },
        email: { type: String, default: null },
        role: { type: [String], default: [] },
    },
    { _id: false }
);

const auditLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true, index: true },
        category: { type: String, required: true, index: true },
        success: { type: Boolean, default: true, index: true },
        statusCode: { type: Number },
        method: String,
        path: String,
        resourceId: { type: String, default: null },
        actor: { type: actorSchema, default: () => ({}) },
        fingerprint: { type: fingerprintSchema, default: () => ({}) },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("audit_logs", auditLogSchema);
