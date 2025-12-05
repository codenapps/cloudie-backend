import express from "express";
import { HandleDeleteAccount, HandleGetStoreProfile, HandleResubmitVerification, HandleSignupStore, HandleUpdateStore, HandleVerifyStoreOtp, HandleGetStoreDashboard, HandleGetChartData } from "../controllers/StoreOwnerController.js";


const router = express.Router();


router.post("/create-store", HandleSignupStore)

router.get("/get-store/:storeID", HandleGetStoreProfile)

router.get("/get-store-dashboard-details/:id", HandleGetStoreDashboard);

router.get("/get-chart-details/:storeId", HandleGetChartData);

router.patch("/store-otp", HandleVerifyStoreOtp);

router.patch("/update-store/:storeID", HandleUpdateStore)

router.patch("/resubmit-verification/:storeID", HandleResubmitVerification)

router.delete("/delete-store/:accID", HandleDeleteAccount)


export default router