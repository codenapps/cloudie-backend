import express from 'express';
import { addAddress, getUserAddresses, updateAddress, deleteAddress } from '../controllers/AddressController.js';
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All address routes require authentication
router.use(authenticateToken);

router.post('/', addAddress);
router.get('/:userId', getUserAddresses);
router.put('/:userId', updateAddress);
router.delete('/:addressId', deleteAddress);

export default router;
