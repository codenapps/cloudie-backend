import mongoose from 'mongoose';
const { Schema } = mongoose;

const ConnectionModel = new Schema({
    userOne: {
        type: mongoose.Schema.Types.ObjectId,
    },
    userTwo: {
        type: mongoose.Schema.Types.ObjectId,
    },
    status: {
        type: [String],
        enum: ["Active", "Blocked"]
    }

}, { timestamps: true });

export default mongoose.model("connection", ConnectionModel);