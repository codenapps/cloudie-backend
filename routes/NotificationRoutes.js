import express from "express";
import { HandleGetNotifications, HandlePostNotif, HandleReadNotif } from "../controllers/NotifController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

router.post("/:userID/post-notification", HandlePostNotif);
router.get("/:userID/get-notifications", HandleGetNotifications);
router.patch("/:userID/read-notifications", HandleReadNotif);

export default router;