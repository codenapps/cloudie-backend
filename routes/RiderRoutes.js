import express from "express";
import { HandleGetRiders, HandleInviteRiders, HandleSubmitVerification, HandleUpdateRiders, RiderOtpVerify } from "../controllers/RiderController.js";


const router = express.Router();

router.post("/:adminID/create-riders", HandleInviteRiders)

router.patch("/:riderID/submit-rider-verification", HandleSubmitVerification)

router.patch("/verify-rider", RiderOtpVerify);

router.get("/:id/get-riders", HandleGetRiders);

router.patch("/:riderID/update-riders", HandleUpdateRiders);

export default router;