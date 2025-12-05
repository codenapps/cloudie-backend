import mongoose from 'mongoose';
const { Schema } = mongoose;

const CardSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    stripeCustomerId: {
        type: String,
        required: true
    },
    stripePaymentMethodId: {
        type: String,
        required: true
    },
    brand: {
        type: String
    },
    last4: {
        type: String
    },
    expMonth: {
        type: Number
    },
    expYear: {
        type: Number
    },
    isDefault: {
        type: Boolean,
        default: false
    }
    
}, { timestamps: true });

export default mongoose.model('Card', CardSchema);
