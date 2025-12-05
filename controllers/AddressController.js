import mongoose from 'mongoose';
import Address from '../models/AddressModel.js'

const addAddress = async (req, res) => {
    try {
        const { userId, street, city, state, zipCode, country, phoneNumber, additionalInfo } = req.body;
        if (!userId || !street || !city || !state || !zipCode || !country) return res.status(400).json({ message: 'Missing required fields' });

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid userId' });
        const newAddress = new Address({ userId, street, city, state, zipCode, country, phoneNumber, additionalInfo });
        await newAddress.save();
        res.status(201).json(newAddress);
    } catch (error) {
        res.status(500).json({ message: 'Error adding address', error });
    }
};

const getUserAddresses = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid userId' });

        const addresses = await Address.find({ userId });
        if (addresses.length === 0) return res.status(404).json({ message: 'No addresses found' });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching addresses', error });
    }
};

const updateAddress = async (req, res) => {
    try {
        const { _id } = req.params;
        const { street, city, state, zipCode, country, phoneNumber, additionalInfo } = req.body;

        if (!mongoose.Types.ObjectId.isValid(_id)) return res.status(400).json({ message: 'Invalid userId' });

        const updatedAddress = await Address.findByIdAndUpdate(_id, street, city, state, zipCode, country, phoneNumber, additionalInfo, { new: true, runValidators: true });
        if (!updatedAddress) return res.status(404).json({ message: 'Address not found' });
        res.json(updatedAddress);
    } catch (error) {
        res.status(500).json({ message: 'Error updating address', error });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(addressId)) return res.status(400).json({ message: 'Invalid addressId' });

        const deletedAddress = await Address.findByIdAndDelete(addressId);
        if (!deletedAddress) return res.status(404).json({ message: 'Address not found' });
        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting address', error });
    }
};

export {
    deleteAddress,
    updateAddress,
    getUserAddresses,
    addAddress
}