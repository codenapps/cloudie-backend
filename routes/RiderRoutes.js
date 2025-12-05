import express from "express";
import { HandleGetRiders, HandleInviteRiders, HandleSubmitVerification, HandleUpdateRiders, RiderOtpVerify, 
    getRidersWithAssignedOrders,
    getSingleRiderDetails,
    getSingleRiderDeliveredOrders
} from "../controllers/RiderController.js";

const router = express.Router();


router.post("/:adminID/create-riders", HandleInviteRiders)

router.get("/:id/get-riders", HandleGetRiders);

router.get("/assigned-orders", getRidersWithAssignedOrders);

router.get("/:riderId/details", getSingleRiderDetails);

router.get("/chart/rider/:riderId/delivered-orders", getSingleRiderDeliveredOrders);

router.patch("/:riderID/submit-rider-verification", HandleSubmitVerification)

router.patch("/verify-rider", RiderOtpVerify);

router.patch("/:riderID/update-riders", HandleUpdateRiders);


export default router;