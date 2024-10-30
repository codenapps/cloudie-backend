import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
    phoneNumber: { type: String },
    additionalInfo: { type: String }
});

export default mongoose.model('address', AddressSchema);
