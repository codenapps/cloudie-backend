import { matchAuditRule } from "../utils/audit/allowlist.js";
import { recordAuditFromRequest } from "../utils/audit/recordAudit.js";

export const auditMiddleware = (req, res, next) => {
    const rule = matchAuditRule(req.method, req.originalUrl || req.path);
    if (!rule) {
        return next();
    }

    res.on("finish", () => {
        recordAuditFromRequest(req, res);
    });

    next();
};
