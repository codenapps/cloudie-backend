import express from "express";
import { HandleGetAllUsers, HandleGetSingleUser, HandleSignupUser, HandleUpdateUser, HandleVerifyUserOtp } from "../controllers/UserController.js";

const router = express.Router();


router.get("/get-users", HandleGetAllUsers);

router.get("/get-user/:userID", HandleGetSingleUser);

router.post("/signup-user", HandleSignupUser);

router.patch("/verify-user", HandleVerifyUserOtp);

router.patch("/:userID/update-user", HandleUpdateUser);


export default router;