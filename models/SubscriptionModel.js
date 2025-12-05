import mongoose from 'mongoose';
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
    storeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoreOwner',
        required: true
    },
    planID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'plans',
        required: true
    },
    transferID: {
        type: String,
        default: '',
    },
    accountID: {
        type: String,
        required: true
    },
    duration: {
        type: [String],
        required: true
    },
    status: {
        type: [String],
        enum: ['Active', 'Suspended', 'Expired', 'Cancelled'],
        default: ['Active']
    }
    
}, { timestamps: true });

export default mongoose.model("Subscription", SubscriptionSchema);