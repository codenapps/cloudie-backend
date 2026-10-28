import express from "express";
import { HandleChat, HandleCreateConnection, handleGetChats, HandleGetConnections } from "../controllers/ConnectionsController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All connection routes require authentication
router.use(authenticateToken);

router.post("/:userOne/create-connection/:userTwo", HandleCreateConnection);
router.post("/:senderID/send-messages/:recieverID/:connectionID", HandleChat);
router.get("/:userOne/get-connection", HandleGetConnections);
router.get("/:connectionID/get-chats", handleGetChats);

export default router;