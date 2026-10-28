import express from "express";
import { HandleCreateAdmin, HandleGetAdmin, HandleGetAllStores, HandleGetAllUsers, HandleUpdateAdmin, HandleVerfiyStore, HandleGetAdminDashboard, HandleGetChartData, HandleGetAllSubscriptions } from "../controllers/AdminController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

router.post("/create-admin", HandleCreateAdmin);
router.get("/get-users", HandleGetAllUsers);
router.get("/get-admin", HandleGetAdmin);
router.get("/get-all-stores/:id", HandleGetAllStores);
router.get("/get-admin-dashboard-details/:id", HandleGetAdminDashboard);
router.get("/get-chart-details/:adminId", HandleGetChartData);
router.get('/admin/get-all-subscriptions', HandleGetAllSubscriptions);
router.patch("/update-admin/:id", HandleUpdateAdmin);
router.patch("/approve-store/:storeID", HandleVerfiyStore);

export default router;