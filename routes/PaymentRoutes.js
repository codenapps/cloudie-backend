import express from "express";
import { createPaymentIntent, getPaymentDetails, updatePaymentStatus } from "../controllers/PaymentController.js"

const router = express.Router();


router.post('/create-payment-intent', createPaymentIntent);

router.get('/:userId', getPaymentDetails);

router.patch('/update-status', updatePaymentStatus);


export default router;