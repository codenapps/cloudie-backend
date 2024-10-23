import express from "express";
import { HandleGetNotifications, HandlePostNotif, HandleReadNotif } from "../controllers/NotifController.js";


const router = express.Router();


router.post("/:userID/post-notification", HandlePostNotif)

router.get("/:userID/get-notifications", HandleGetNotifications)

router.patch("/:userID/read-notifications", HandleReadNotif)

export default router