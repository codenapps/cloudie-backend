import express from "express";
import {
    HandlePlaceOrder,
    HandleGetUserOrders,
    HandleGetUserOrdersStore,
    HandleGetSingleOrder,
    HandleUpdateOrderStatus,
    HandleAssignRider,
    HandleRiderAccept,
    HandleRiderReject,
    HandleGetRiderOrders,
    HandleGetAllsUserOrdersStore
} from "../controllers/OrderController.js";

const router = express.Router();

// Order routes
router.post("/:userId/place", HandlePlaceOrder);
router.get("/user/:userId", HandleGetUserOrders);
router.get("/store/:storeID", HandleGetUserOrdersStore);
router.get("/order-details/:adminId", HandleGetAllsUserOrdersStore);
router.get("/:orderId", HandleGetSingleOrder);
router.patch("/:orderId/status", HandleUpdateOrderStatus);

// Rider routes
router.post("/:orderId/assign-rider", HandleAssignRider);
router.patch("/:orderId/rider-accept", HandleRiderAccept);
router.patch("/:orderId/rider-reject", HandleRiderReject);
router.get("/rider/:riderId", HandleGetRiderOrders);

export default router;
