import express from "express";
import { HandleChat, HandleCreateConnection, handleGetChats, HandleGetConnections } from "../controllers/ConnectionsController.js";

const router = express.Router();

router.post("/:userOne/create-connection/:userTwo", HandleCreateConnection)

router.post("/:senderID/send-messages/:recieverID/:connectionID", HandleChat)

router.get("/:userOne/get-connection", HandleGetConnections)

router.get("/:connectionID/get-chats", handleGetChats)

export default router