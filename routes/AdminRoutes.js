import express from "express";
import { HandleCreateAdmin, HandleGetAdmin, HandleGetAllStores, HandleGetAllUsers, HandleUpdateAdmin, HandleVerfiyStore, HandleGetAdminDashboard, HandleGetChartData } from "../controllers/AdminController.js";

const router = express.Router();


router.get("/get-users", HandleGetAllUsers);

router.post("/create-admin", HandleCreateAdmin);

router.patch("/update-admin/:id", HandleUpdateAdmin);

router.get("/get-admin", HandleGetAdmin);

router.patch("/approve-store/:storeID", HandleVerfiyStore);

router.get("/get-all-stores/:id", HandleGetAllStores)

router.get("/get-admin-dashboard-details/:id", HandleGetAdminDashboard);

router.get("/get-chart-details/:adminId", HandleGetChartData);

export default router;