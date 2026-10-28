import rateLimit from "express-rate-limit";

// General API rate limiter - 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        message: "Too many requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for auth endpoints - 10 requests per 15 minutes per IP
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: {
        message: "Too many authentication attempts, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for login specifically - 5 requests per 15 minutes per IP
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 5 login attempts per windowMs
    message: {
        message: "Too many login attempts, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for password reset/OTP - 3 requests per hour per IP
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: {
        message: "Too many password reset requests, please try again after 1 hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
});