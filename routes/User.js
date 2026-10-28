import express from "express";
import { HandleGetAllUsers, HandleGetSingleUser, HandleSignupUser, HandleUpdateUser, HandleVerifyUserOtp, HandleGetAllUser } from "../controllers/UserController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes - signup and verification don't need auth
router.post("/signup-user", HandleSignupUser);
router.patch("/verify-user", HandleVerifyUserOtp);

// Protected routes - require authentication
router.use(authenticateToken);

router.get("/get-users", HandleGetAllUsers);
router.get("/get-all-users", HandleGetAllUser);
router.get("/get-user/:userID", HandleGetSingleUser);
router.patch("/:userID/update-user", HandleUpdateUser);

export default router;
