import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
            stock: {
                type: Number,
                required: true
            },
            storeID: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products'
            },
        },
    ],
});

export default mongoose.model('cart', CartSchema);
