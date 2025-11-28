import mongoose from 'mongoose';
const { Schema } = mongoose;

const RiderModel = new Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    w9form: {
        type: String,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    country: {
        type: String,
    },
    addressLine: {
        type: String,
    },
    postalCode: {
        type: String,
    },
    OtpCode: {
        type: Number
    },
    OtpExp: {
        type: Number
    },
    phone: {
        type: Number
    },
    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    verified: {
        type: [String],
        enum: ["Accepted", "Pending", "Rejected"],
        default: ["Pending"],
    },
    vehicleType: {
        type: String,
    },
    profile_image: {
        type: String,
        default: 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps'
    },
    role: {
        type: [String],
        enum: ['Rider'],
        default: ['Rider']
    },
    status: {
        type: [String],
        enum: ['Active', 'Inactive'],
        default: ['Inactive']
    },
    riderLatitude: {
        type: Number,
    },
    riderLongitude: {
        type: Number
    }
}, { timestamps: true });

export default mongoose.model("Riders", RiderModel);