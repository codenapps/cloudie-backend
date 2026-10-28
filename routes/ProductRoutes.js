import express from "express";
import { HandleCreateProduct, HandleDeleteProduct, HandleGetBestSellers, HandleUpdateProduct, HandleGetProducts, HandleGetSingleProduct } from "../controllers/ProductController.js";
import { authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Protected routes - require authentication
router.post('/create-product/:storeID', authenticateToken, HandleCreateProduct);
router.patch('/:storeID/update-product/:productID', authenticateToken, HandleUpdateProduct);
router.delete('/:storeID/delete-products/:productID', authenticateToken, HandleDeleteProduct);

// Public routes with optional auth for role-based filtering
router.get('/get-products', optionalAuth, HandleGetProducts);
router.get('/best-sellers', optionalAuth, HandleGetBestSellers);
router.get('/get-product/:productId', optionalAuth, HandleGetSingleProduct);

export default router;