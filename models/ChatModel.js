import mongoose from 'mongoose';
const { Schema } = mongoose;

const ChatModel = new Schema({
    senderID: {
        type: mongoose.Schema.Types.ObjectId,
    },
    connectionID: {
        type: mongoose.Schema.Types.ObjectId,
    },
    recieverID: {
        type: mongoose.Schema.Types.ObjectId,
    },
    message: {
        type: String,
    },
    status: {
        type: [String],
        enum: ['sent', 'delivered', 'seen'],
        default: ['sent']
    },

}, { timestamps: true });

export default mongoose.model("chats", ChatModel);