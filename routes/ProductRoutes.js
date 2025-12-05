import express from "express";
import { HandleCreateProduct, HandleDeleteProduct, HandleGetBestSellers, HandleUpdateProduct, HandleGetProducts } from "../controllers/ProductController.js";


const router = express.Router();


router.post('/create-product/:storeID', HandleCreateProduct);

router.get('/get-products', HandleGetProducts);

router.get('/best-sellers', HandleGetBestSellers);

router.patch('/:storeID/update-product/:productID', HandleUpdateProduct);

router.delete('/:storeID/delete-products/:productID', HandleDeleteProduct);


export default router;