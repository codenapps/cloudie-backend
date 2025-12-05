import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    paymentStatus: {
        type: String
    },
    clientSecret: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

});

export default mongoose.model('payment', PaymentSchema);