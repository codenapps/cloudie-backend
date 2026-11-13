const SENSITIVE_KEYS = new Set([
    "password",
    "newPassword",
    "oldPassword",
    "confirmPassword",
    "accessToken",
    "refreshToken",
    "token",
    "otp",
    "w9form",
    "profile_image",
    "tokenID",
    "cardNumber",
    "cvc",
]);

const redactValue = (key, value) => {
    if (SENSITIVE_KEYS.has(key)) {
        return "[redacted]";
    }
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return sanitizeAuditMetadata(value);
    }
    return value;
};

export const sanitizeAuditMetadata = (payload = {}) => {
    if (!payload || typeof payload !== "object") {
        return {};
    }
    const out = {};
    for (const [key, value] of Object.entries(payload)) {
        if (SENSITIVE_KEYS.has(key)) {
            out[key] = "[redacted]";
            continue;
        }
        if (value && typeof value === "object" && !Array.isArray(value)) {
            out[key] = sanitizeAuditMetadata(value);
        } else {
            out[key] = value;
        }
    }
    return out;
};
