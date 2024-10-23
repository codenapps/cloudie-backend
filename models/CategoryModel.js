import mongoose from 'mongoose';
const { Schema } = mongoose;

const CategoryModel = new Schema({
    adminID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin"
    },
    name: {
        type: String,
        require: true,
    },
    status: {
        type: [String],
        enum: ["Active", "Inactive"],
        default: ["Active"]
    },
    slug: {
        type: String,
        require: true,
    },
    catImage: {
        type: String,
        default: 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps'
    },
}, { timestamps: true });

export default mongoose.model("categories", CategoryModel);