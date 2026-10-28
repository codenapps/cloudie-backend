import express from "express";
import {
    HandleGetRiders, HandleInviteRiders, HandleSubmitVerification, HandleUpdateRiders, RiderOtpVerify,
    getRidersWithAssignedOrders,
    getSingleRiderDetails,
    getSingleRiderDeliveredOrders,
    HandleGetRidersForOrders
} from "../controllers/RiderController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes - verification doesn't need auth
router.patch("/verify-rider", RiderOtpVerify);
router.patch("/:riderID/submit-rider-verification", HandleSubmitVerification);

// Protected routes - require authentication
router.use(authenticateToken);

router.post("/:adminID/create-riders", HandleInviteRiders);
router.get("/:id/get-riders", HandleGetRiders);
router.get("/get-riders", HandleGetRidersForOrders);
router.get("/assigned-orders", getRidersWithAssignedOrders);
router.get("/:riderId/details", getSingleRiderDetails);
router.get("/chart/rider/:riderId/delivered-orders", getSingleRiderDeliveredOrders);
router.patch("/:riderID/update-riders", HandleUpdateRiders);

export default router;