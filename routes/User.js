import express from "express";
import { HandleGetAllUsers, HandleGetSingleUser, HandleSignupUser, HandleUpdateUser, HandleVerifyUserOtp, HandleGetAllUser } from "../controllers/UserController.js";

const router = express.Router();

router.post("/signup-user", HandleSignupUser);

router.get("/get-users", HandleGetAllUsers);

router.get("/get-all-users", HandleGetAllUser);

router.get("/get-user/:userID", HandleGetSingleUser);

router.patch("/verify-user", HandleVerifyUserOtp);

router.patch("/:userID/update-user", HandleUpdateUser);

export default router;
