import mongoose from 'mongoose';
const { Schema } = mongoose;

const AdminSchema = new Schema({
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
    role: {
        type: [String],
        enum: ['Admin'],
        default: ['Admin']
    },
    profile_image: {
        type: String,
        default: 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1712595866/profile_demo_image_g57r6t.jpg?_s=public-apps'
    },
}, { timestamps: true });

export default mongoose.model("admin", AdminSchema);