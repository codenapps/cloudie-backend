import express from "express";
import {
    HandleCreateCategory,
    HandleDeleteCategory,
    HandleGetCategories,
    HandleUpdateCategory,
} from "../controllers/CategoryController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public route with optional auth
router.get("/get-all-categories", optionalAuth, HandleGetCategories);

// Protected routes - require authentication
router.use(authenticateToken);

router.post("/create-category/:adminID", HandleCreateCategory);
router.patch("/update-category/:adminID/:catID", HandleUpdateCategory);
router.delete("/:adminID/delete-category/:catID", HandleDeleteCategory);

export default router;