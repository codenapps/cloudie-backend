import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProductModel = new Schema({
    storeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'storeOwner'
    },
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
    },
    slug: {
        type: String,
        required: true
    },
    isVariable: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
    },
    discountPrice: {
        type: Number,
    },
    stock: {
        type: Number,
    },
    category: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'categories',
        required: false
    },
    netWeight: {
        type: String,
    },
    length: {
        type: String,
    },
    width: {
        type: String,
    },
    height: {
        type: String,
    },
    variations: [{
        title: {
            type: String,
        },
        discountPrice: {
            type: Number,
        },
        price: {
            type: Number,
        },
        netWeight: {
            type: String,
        },
        length: {
            type: String,
        },
        width: {
            type: String,
        },
        height: {
            type: String,
        },
        stock: {
            type: Number,
        },
    }],
    productImage: {
        type: String,
        default: 'https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps'
    },
    galleryImages: {
        type: [String],
        default: ['https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps']
    },
    status: {
        type: [String],
        enum: ['Active', 'Draft', 'Completed', 'In Progress'],
        default: ['Active']
    }

}, { timestamps: true });

export default mongoose.model("products", ProductModel);



// const variationSchema = new mongoose.Schema({
//   attribute: String,
//   value: String,
//   additionalPrice: Number,
// });

// const productSchema = new mongoose.Schema({
//   name: { type: String, requiredd: true },
//   description: String,
//   basePrice: { type: Number, requiredd: true },
//   variations: [variationSchema],
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// });
