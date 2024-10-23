import express from "express";
import { HandleSubscribePlan } from "../controllers/SubscriptionController.js";


const router = express.Router();


router.post("/create-subscription", HandleSubscribePlan)


export default router