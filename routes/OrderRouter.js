// routes/orderRoutes.js
import express from "express";
import {
    HandlePlaceOrder,
    HandleGetUserOrders,
    HandleGetSingleOrder,
    HandleUpdateOrderStatus,
} from "../controllers/OrderController.js";

const router = express.Router();

router.post("/:userId/place", HandlePlaceOrder);

router.get("/user/:userId", HandleGetUserOrders);

router.get("/:orderId", HandleGetSingleOrder);

router.patch("/:orderId/status", HandleUpdateOrderStatus);

export default router;
