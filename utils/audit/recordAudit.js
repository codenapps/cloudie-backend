import AuditLog from "../../models/AuditLogModel.js";
import { buildFingerprint, buildActorFromRequest, extractResourceId } from "./buildFingerprint.js";
import { sanitizeAuditMetadata } from "./sanitizeAuditMetadata.js";
import { matchAuditRule } from "./allowlist.js";

export const setAuditActor = (res, actor) => {
    res.locals.auditActor = actor;
};

export const recordAudit = async ({
    req,
    res,
    rule,
    success,
    actorOverride,
    metadataExtra,
}) => {
    const actor = actorOverride || res?.locals?.auditActor || buildActorFromRequest(req);
    const fingerprint = buildFingerprint(req);

    const metadata = sanitizeAuditMetadata({
        params: req.params,
        query: req.query,
        body: req.body,
        ...metadataExtra,
    });

    await AuditLog.create({
        action: rule.action,
        category: rule.category,
        success,
        statusCode: res?.statusCode,
        method: req.method,
        path: req.originalUrl?.split("?")[0] || req.path,
        resourceId: extractResourceId(req),
        actor,
        fingerprint,
        metadata,
    });
};

export const recordAuditFromRequest = async (req, res) => {
    const rule = matchAuditRule(req.method, req.originalUrl || req.path);
    if (!rule) {
        return;
    }
    const success = res.statusCode >= 200 && res.statusCode < 400;
    try {
        await recordAudit({ req, res, rule, success });
    } catch (err) {
        console.error("Audit log write failed:", err.message);
    }
};
