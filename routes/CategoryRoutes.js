import express from "express";
import {
    HandleCreateCategory,
    HandleDeleteCategory,
    HandleGetCategories,
    HandleUpdateCategory,
} from "../controllers/CategoryController.js";

const router = express.Router();


router.post("/create-category/:adminID", HandleCreateCategory)

router.get("/get-all-categories", HandleGetCategories)

router.patch("/update-category/:adminID/:catID", HandleUpdateCategory)

router.delete("/:adminID/delete-category/:catID", HandleDeleteCategory)


export default router