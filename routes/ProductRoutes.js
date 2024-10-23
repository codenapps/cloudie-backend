import express from "express";
import { HandleCreateProduct, HandleDeleteProduct } from "../controllers/ProductController.js";
import { HandleUpdateProduct } from "../controllers/ProductController.js";
import { HandleGetProducts } from "../controllers/ProductController.js";


const router = express.Router();


router.post('/create-product/:storeID', HandleCreateProduct);

router.patch('/:storeID/update-product/:productID', HandleUpdateProduct);

router.get('/get-products', HandleGetProducts);

router.delete('/:storeID/delete-products/:productID', HandleDeleteProduct);



export default router;