import express from "express";
import { HandleDeleteAccount, HandleGetStoreProfile, HandleResubmitVerification, HandleSignupStore, HandleUpdateStore, HandleVerifyStoreOtp, HandleGetStoreDashboard } from "../controllers/StoreOwnerController.js";


const router = express.Router();


router.post("/create-store", HandleSignupStore)

router.patch("/store-otp", HandleVerifyStoreOtp);

router.patch("/update-store/:storeID", HandleUpdateStore)

router.patch("/resubmit-verification/:storeID", HandleResubmitVerification)

router.get("/get-store/:storeID", HandleGetStoreProfile)
router.get("/get-store-dashboard-details/:StoreId", HandleGetStoreDashboard);
// router.delete("/delete-store/:storeID", HandleDeleteAccount)

// Test Deletion
router.delete("/delete-store/:accID", HandleDeleteAccount)

export default router