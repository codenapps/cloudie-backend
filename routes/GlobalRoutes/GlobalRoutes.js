import express from "express";
import { HandleForgotPassword, HandleLogin, HandleResendOtp, HandleResetPassword, HandleVerifyOtp } from "../../controllers/GlobalControllers/AuthControllers.js";

const router = express.Router();


router.post('/login', HandleLogin)

router.patch('/forget-password', HandleForgotPassword)

router.patch('/verify-otp', HandleVerifyOtp)

router.patch("/reset-password", HandleResetPassword)

router.patch("/resend-otp", HandleResendOtp)


export default router;