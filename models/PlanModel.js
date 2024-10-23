import mongoose from 'mongoose';
const { Schema } = mongoose;

const PlanSchema = new Schema({
    adminID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: false
    },
    planName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: null
    },
    discountedPrice: {
        type: Number,
        default: null
    },
    trialDays: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: [String],
        enum: ["Monthly", "Yearly", "Quarterly", "Trial"],
        default: ["Monthly"]
    }
}, { timestamps: true });

export default mongoose.model("plans", PlanSchema);