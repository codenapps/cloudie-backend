import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    username: {
        type: String,
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
                ref: 'StoreOwner'
            },
            riderID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Riders'
            },
        }
    ],
    storeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoreOwner',
    },
    subtotal: {
        type: Number,
        required: true,
    },
    storePayout: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            'Pending',
            'PendingStoreAccept',
            'ReadyForPickup',
            'StoreRejected',
            'InProgress',
            'Assigned',
            'Shipped',
            'Delivered',
            'Cancelled',
        ],
        default: 'PendingStoreAccept'
    },
    message: {
        type: String,
    },
    userLatitude: {
        type: Number,
        required: true
    },
    userLongitude: {
        type: Number,
        required: true
    },
    // Snapshot of delivery address at order time (does not change if user edits profile later)
    deliveryAddress: {
        label: { type: String, default: null },
        addressLine: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        country: { type: String, default: null },
        postalCode: { type: String, default: null },
        phone: { type: String, default: null },
        addressId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'address',
            default: null,
        },
    },
    latitude: {
        type: Number,
    },
    longitude: {
        type: Number,
    },
    assignedRider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Riders',
        default: null
    },
    riderUsername: {
        type: String,
        default: null
    },
    rejectedRiders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Riders'
        }
    ],
    paymentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Paid",
    },
    riderFare: {
        type: Number,
        default: 0,
    },
    adminFare: {
        type: Number,
        default: 0,
    },

}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
