import crypto from "crypto";
import jwt from "jsonwebtoken";
import { verifyAccessToken, verifyRefreshToken } from "../jwt.js";

const clientHeader = (req, name) => {
    const value = req.headers[name.toLowerCase()];
    return value ? String(value) : undefined;
};

export const buildFingerprint = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const ipChain = forwarded
        ? String(forwarded)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : [];

    const ip = ipChain[0] || req.ip || req.socket?.remoteAddress || null;

    const fingerprint = {
        ip,
        ipChain,
        userAgent: req.headers["user-agent"] || null,
        acceptLanguage: req.headers["accept-language"] || null,
        origin: req.headers.origin || null,
        referer: req.headers.referer || null,
        clientId: clientHeader(req, "x-client-id"),
        platform: clientHeader(req, "x-client-platform"),
        appVersion: clientHeader(req, "x-app-version"),
        deviceModel: clientHeader(req, "x-device-model"),
        osVersion: clientHeader(req, "x-os-version"),
    };

    const stable = [
        fingerprint.ip,
        fingerprint.userAgent,
        fingerprint.clientId,
        fingerprint.platform,
        fingerprint.deviceModel,
        fingerprint.osVersion,
    ].join("|");

    fingerprint.fingerprintHash = crypto
        .createHash("sha256")
        .update(stable)
        .digest("hex");

    return fingerprint;
};

const actorFromDecoded = (decoded) => {
    if (!decoded || typeof decoded !== "object") {
        return null;
    }
    const roles = decoded.role;
    return {
        _id: decoded._id?.toString?.() || decoded._id || null,
        email: decoded.email ? String(decoded.email).trim().toLowerCase() : null,
        role: Array.isArray(roles) ? roles : roles ? [String(roles)] : [],
    };
};

const tokenClaims = (token, verifyFn) => {
    if (!token || typeof token !== "string") {
        return null;
    }
    const verified = verifyFn(token);
    if (verified) {
        return verified;
    }
    try {
        const decoded = jwt.decode(token);
        return decoded && typeof decoded === "object" ? decoded : null;
    } catch {
        return null;
    }
};

export const buildActorFromRequest = (req) => {
    if (req.user) {
        const fromUser = actorFromDecoded(req.user);
        if (fromUser && (fromUser._id || fromUser.email)) {
            return fromUser;
        }
    }

    const authHeader = req.headers.authorization || req.headers.Authorization;
    const accessToken =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
            ? authHeader.slice(7)
            : authHeader?.split?.(" ")?.[1];

    if (accessToken) {
        const actor = actorFromDecoded(tokenClaims(accessToken, verifyAccessToken));
        if (actor && (actor._id || actor.email)) {
            return actor;
        }
    }

    const refreshToken = req.body?.refreshToken;
    if (refreshToken) {
        const actor = actorFromDecoded(tokenClaims(refreshToken, verifyRefreshToken));
        if (actor && (actor._id || actor.email)) {
            return actor;
        }
    }

    if (req.body?.email) {
        return {
            _id: null,
            email: String(req.body.email).trim().toLowerCase(),
            role: [],
        };
    }

    return { _id: null, email: null, role: [] };
};

export const extractResourceId = (req) => {
    const p = req.params || {};
    return (
        p.orderId ||
        p.productID ||
        p.productId ||
        p.storeID ||
        p.planID ||
        p.userID ||
        p.userId ||
        p.riderID ||
        p.riderId ||
        p.id ||
        null
    );
};
