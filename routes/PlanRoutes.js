import express from "express";
import { HandleCreatePlan, HandleDeletePlan, HandleGetPlans, HandleGetSinglePlan, HandlePurchasePlan, HandleSubscriptionAction, HandleUpdateCard, HandleUpdatePlan } from "../controllers/PlanController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public route with optional auth
router.get("/get-plans", optionalAuth, HandleGetPlans);

// Protected routes - require authentication
router.use(authenticateToken);

router.post("/:adminID/create-plan", HandleCreatePlan);
router.post("/:storeID/purchase-plan/:planID", HandlePurchasePlan);
router.get("/:storeID/get-single-plans/:planID", HandleGetSinglePlan);
router.patch("/:storeID/update-card", HandleUpdateCard);
router.patch("/:id/action-plan/:storeID", HandleSubscriptionAction);
router.patch("/:adminID/update-plan/:planID", HandleUpdatePlan);
router.delete("/:adminID/delete-plan/:planID", HandleDeletePlan);

export default router;
