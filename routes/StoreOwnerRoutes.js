import express from "express";
import { HandleDeleteAccount, HandleGetStoreProfile, HandleResubmitVerification, HandleSignupStore, HandleUpdateStore, HandleVerifyStoreOtp, HandleGetStoreDashboard, HandleGetChartData } from "../controllers/StoreOwnerController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes - signup and verification don't need auth
router.post("/create-store", HandleSignupStore);
router.patch("/store-otp", HandleVerifyStoreOtp);
router.patch("/resubmit-verification/:storeID", HandleResubmitVerification);

// Protected routes - require authentication
router.use("/get-store", authenticateToken);
router.use("/get-store-dashboard-details", authenticateToken);
router.use("/get-chart-details", authenticateToken);
router.use("/update-store", authenticateToken);
router.use("/delete-store", authenticateToken);

router.get("/get-store/:storeID", HandleGetStoreProfile);
router.get("/get-store-dashboard-details/:id", HandleGetStoreDashboard);
router.get("/get-chart-details/:storeId", HandleGetChartData);
router.patch("/update-store/:storeID", HandleUpdateStore);
router.delete("/delete-store/:accID", HandleDeleteAccount);

export default router;