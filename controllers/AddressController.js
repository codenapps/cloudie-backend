import mongoose from 'mongoose';
import Address from '../models/AddressModel.js';

const addAddress = async (req, res) => {
    try {
        const {
            userId,
            street,
            addressLine,
            city,
            state,
            zipCode,
            country,
            phoneNumber,
            additionalInfo,
            label,
            latitude,
            longitude,
            isDefault,
        } = req.body;

        if (!userId || !street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (latitude == null || longitude == null) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        if (req.user?._id && req.user._id !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const count = await Address.countDocuments({ userId });
        const newAddress = new Address({
            userId,
            street,
            addressLine: addressLine || street,
            city,
            state,
            zipCode,
            country,
            phoneNumber,
            additionalInfo,
            label: label || 'Home',
            latitude,
            longitude,
            isDefault: isDefault === true || count === 0,
        });
        await newAddress.save();
        res.status(201).json(newAddress);
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error: error.message });
    }
};

const getUserAddresses = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId' });
        }
        if (req.user?._id && req.user._id !== userId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const addresses = await Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 });
        return res.status(200).json(addresses || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching addresses', error: error.message });
    }
};

const updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: 'Invalid addressId' });
        }

        const existing = await Address.findById(addressId);
        if (!existing) {
            return res.status(404).json({ message: 'Address not found' });
        }
        if (req.user?._id && existing.userId.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const allowed = [
            'street',
            'addressLine',
            'city',
            'state',
            'zipCode',
            'country',
            'phoneNumber',
            'additionalInfo',
            'label',
            'latitude',
            'longitude',
            'isDefault',
        ];
        const payload = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) payload[key] = updates[key];
        }
        if (payload.street && !payload.addressLine) {
            payload.addressLine = payload.street;
        }

        Object.assign(existing, payload);
        await existing.save();
        res.json(existing);
    } catch (error) {
        res.status(500).json({ message: 'Error updating address', error: error.message });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({ message: 'Invalid addressId' });
        }

        const existing = await Address.findById(addressId);
        if (!existing) {
            return res.status(404).json({ message: 'Address not found' });
        }
        if (req.user?._id && existing.userId.toString() !== req.user._id) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await Address.findByIdAndDelete(addressId);
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting address', error: error.message });
    }
};

export {
    deleteAddress,
    updateAddress,
    getUserAddresses,
    addAddress,
};
