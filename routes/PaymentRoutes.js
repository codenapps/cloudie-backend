import express from "express";
import { createPaymentIntent, getPaymentDetails, updatePaymentStatus } from "../controllers/PaymentController.js"
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All payment routes require authentication
router.use(authenticateToken);

router.post('/create-payment-intent', createPaymentIntent);
router.get('/:userId', getPaymentDetails);
router.patch('/update-status', updatePaymentStatus);

export default router;