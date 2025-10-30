import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            storeID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', "InProgress", 'Assigned', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    message: {
        type: String,
    },
    latitude: {
        type: String,
        required: true
    },
    longitude: {
        type: String,
        required: true
    },
    assignedRider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rider',
        default: null
    },
    rejectedRiders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rider'
        }
    ]
    // orderDate: {
    //     type: Date,
    //     default: Date.now
    // },
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
