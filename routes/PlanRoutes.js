import express from "express";
import { HandleCreatePlan, HandleDeletePlan, HandleGetPlans, HandleGetSinglePlan, HandlePurchasePlan, HandleSubscriptionAction, HandleUpdateCard, HandleUpdatePlan } from "../controllers/PlanController.js";


const router = express.Router();


router.post("/:adminID/create-plan", HandleCreatePlan);

router.get("/get-plans", HandleGetPlans);

router.get("/:storeID/get-single-plans/:planID", HandleGetSinglePlan);

router.patch("/:storeID/update-card", HandleUpdateCard);

router.post("/:storeID/purchase-plan/:planID", HandlePurchasePlan);

router.patch("/:id/action-plan/:storeID", HandleSubscriptionAction);

router.patch("/:adminID/update-plan/:planID", HandleUpdatePlan);

router.delete("/:adminID/delete-plan/:planID", HandleDeletePlan)

export default router;
