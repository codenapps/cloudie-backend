import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
    username: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    profile_image: {
        type: String,
        default: 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps'
    },
    OtpCode: {
        type: Number
    },
    OtpExp: {
        type: Number
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    addressLine: {
        type: String,
        required: true
    },
    postalCode: {
        type: Number,
        required: true
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: [String],
        enum: ['User'],
        default: ['User']
    },
    userLatitude: {
        type: Number,
        required: false
    },
    userLongitude: {
        type: Number,
        required: false
    },

}, { timestamps: true });

export default mongoose.model("user", UserSchema);