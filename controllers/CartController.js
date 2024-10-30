import mongoose from "mongoose";
import Product from "../models/ProductModel.js"
import Cart from "../models/CartModel.js"

const HandleAddToCart = async (req, res) => {
    const { userId, productId, stock } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const product = await Product.findById(productId).session(session);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userId }).session(session);
        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, stock }] });
        } else {
            const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].stock += stock;
            } else {
                cart.items.push({ productId, stock });
            }
        }

        await cart.save();
        await session.commitTransaction();
        session.endSession();
        res.json(cart);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Error adding to cart', error });
    }
};

const HandleGetCart = async (req, res) => {
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId', 'title discountPrice variations productImage galleryImages status');
    res.json(cart);
};

const HandleUpdateCart = async (req, res) => {
    const { userId } = req.params;
    const { storeID, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(storeID)) {
        return res.status(400).json({ message: 'Invalid userId or productId' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === storeID);
        if (itemIndex > -1) {
            if (stock <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].stock = stock;
            }
        } else {
            cart.items.push({ storeID, stock });
        }

        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating cart', error });
    }
};


export { HandleAddToCart, HandleGetCart, HandleUpdateCart };
