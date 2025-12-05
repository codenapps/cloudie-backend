import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReviewRiderSchema = new Schema({
    user: {
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

export default mongoose.model('riderReview', ReviewRiderSchema);