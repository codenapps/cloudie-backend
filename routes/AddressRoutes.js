import express from 'express';
import { addAddress, getUserAddresses, updateAddress, deleteAddress } from '../controllers/AddressController.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

router.post('/', addAddress);

router.get('/:userId', getUserAddresses);

router.put('/:userId', updateAddress);

router.delete('/:addressId', deleteAddress);

export default router;
