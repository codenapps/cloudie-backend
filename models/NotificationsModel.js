import mongoose from 'mongoose';
const { Schema } = mongoose;

const NotificationsModel = new Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId
    },
    text: {
        type: String,
        required: true
    },
    
    read: {
        type: Boolean,
        default: false
    }
    
}, { timestamps: true });

export default mongoose.model("Notifications", NotificationsModel);