import express from "express";
import { HandleSubscribePlan } from "../controllers/SubscriptionController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All subscription routes require authentication
router.use(authenticateToken);

router.post("/create-subscription", HandleSubscribePlan);

export default router;