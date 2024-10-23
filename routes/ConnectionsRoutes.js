import express from "express";
import { HandleChat, HandleCreateConnection, handleGetChats, HandleGetConnections } from "../controllers/ConnectionsController.js";

const router = express.Router();

router.post("/:userOne/create-connection/:userTwo", HandleCreateConnection)

router.get("/:userOne/get-connection", HandleGetConnections)


router.post("/:senderID/send-messages/:recieverID/:connectionID", HandleChat)

router.get("/:connectionID/get-chats", handleGetChats)

export default router