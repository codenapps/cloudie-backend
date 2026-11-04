import express from "express";
import {
    HandlePlaceOrder,
    HandleStoreOrderResponse,
    HandleGetUserOrders,
    HandleGetUserOrdersStore,
    HandleGetSingleOrder,
    HandleUpdateOrderStatus,
    HandleGetRiderOrders,
    HandleGetAllsUserOrdersStore,
    HandleGetAvailableRiderJobs,
    HandleRiderAcceptOrder,
} from "../controllers/OrderController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All order routes require authentication
router.use(authenticateToken);

router.post("/:userId/place", HandlePlaceOrder);
router.patch("/store/:storeID/:orderId/respond", HandleStoreOrderResponse);
router.get("/user/:userId", HandleGetUserOrders);
router.get("/store/:storeID", HandleGetUserOrdersStore);
router.get("/order-details/:adminId", HandleGetAllsUserOrdersStore);
router.get("/rider/:riderId/available-jobs", HandleGetAvailableRiderJobs);
router.patch("/rider/:riderId/:orderId/accept", HandleRiderAcceptOrder);
router.get("/rider/:riderId", HandleGetRiderOrders);
router.get("/:orderId", HandleGetSingleOrder);
router.patch("/:orderId/status", HandleUpdateOrderStatus);

export default router;
