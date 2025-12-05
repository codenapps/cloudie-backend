import express from "express";
import {
    HandlePlaceOrder,
    HandleGetUserOrders,
    HandleGetUserOrdersStore,
    HandleGetSingleOrder,
    HandleUpdateOrderStatus,
    HandleGetRiderOrders,
    HandleGetAllsUserOrdersStore
} from "../controllers/OrderController.js";

const router = express.Router();


router.post("/:userId/place", HandlePlaceOrder);

router.get("/user/:userId", HandleGetUserOrders);

router.get("/store/:storeID", HandleGetUserOrdersStore);

router.get("/order-details/:adminId", HandleGetAllsUserOrdersStore);

router.get("/:orderId", HandleGetSingleOrder);

router.get("/rider/:riderId", HandleGetRiderOrders);

router.patch("/:orderId/status", HandleUpdateOrderStatus);


export default router;
