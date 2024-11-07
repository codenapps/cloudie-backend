const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true } // capture price at purchase time
        }
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
    orderDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
