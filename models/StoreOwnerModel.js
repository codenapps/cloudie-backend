import mongoose from 'mongoose';
const { Schema } = mongoose;

const StoreOwner = new Schema({
    storeName: {
        type: String,
        required: true
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
        required: true
    },
    OtpCode: {
        type: Number
    },
    OtpExp: {
        type: Number
    },
    logo: {
        type: String,
        default: "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1718991037/depositphotos_58387439-stock-illustration-abstract-vector-logo_vyov6d.jpg?_s=public-apps",
    },
    verified: {
        type: [String],
        enum: ["Accepted", "Pending", "Rejected"],
        default: ["Pending"],
    },
    isOtpVerified: {
        type: Boolean,
        default: false,
    },
    description: {
        type: String,
        required: true
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
    dob: {
        type: String,
        required: true
    },
    identity_back: {
        type: String,
        required: true
    },
    identity_front: {
        type: String,
        required: true
    },
    ssn_last_4: {
        type: Number,
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
    accountID: {
        type: String,
        default: ''
    },
    cardID: {
        type: String,
        default: ''
    },
    role: {
        type: [String],
        enum: ['StoreOwner'],
        default: ['StoreOwner']
    },
    status: {
        type: [String],
        enum: ['Active', 'Inactive'],
        default: ['Active']
    },
    categories: {
        type: String,
        enum: ['snack-seller', 'non-snack-seller'],
        required: true
    },
    storeLatitude: {
        type: Number,
        required: true
    },
    storeLongitude: {
        type: Number,
        required: true
    }
}, { timestamps: true });

export default mongoose.model("StoreOwner", StoreOwner);