import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReviewSchema = new Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
    }
    
}, { timestamps: true });

export default mongoose.model('review', ReviewSchema);