import express from 'express';
import { addAddress, getUserAddresses, updateAddress, deleteAddress } from '../controllers/AddressController.js';

const router = express.Router();

router.post('/', addAddress);

router.get('/:userId', getUserAddresses);

router.put('/:userId', updateAddress);

router.delete('/:addressId', deleteAddress);

export default router;
