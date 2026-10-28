import express from "express";
import { HandleForgotPassword, HandleLogin, HandleResendOtp, HandleResetPassword, HandleVerifyOtp, HandleRefreshToken, HandleLogout } from "../../controllers/GlobalControllers/AuthControllers.js";
import { loginLimiter, passwordResetLimiter, authLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

// Apply stricter rate limiting to auth routes
router.use(authLimiter);

// Login with stricter limit
router.post('/login', loginLimiter, HandleLogin);

router.patch('/forget-password', passwordResetLimiter, HandleForgotPassword);

router.patch('/verify-otp', passwordResetLimiter, HandleVerifyOtp);

router.patch("/reset-password", passwordResetLimiter, HandleResetPassword);

router.patch("/resend-otp", passwordResetLimiter, HandleResendOtp);

router.post("/refresh-token", HandleRefreshToken);

router.post("/logout", HandleLogout);

export default router;