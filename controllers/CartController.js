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

        console.log(product, "prodyuct");


        let cart = await Cart.findOne({ userId }).session(session);
        const storeID = product.storeID;
        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, stock, storeID }] });
        } else {
            const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].stock += stock;
            } else {
                cart.items.push({ productId, stock, storeID });
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
    const cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId', 'title discountPrice variations productImage galleryImages status stock');
    res.json(cart);
};

const HandleUpdateCart = async (req, res) => {
    const { userId } = req.params;
    const { productId, stock } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId) || stock < 0) {
        return res.status(400).json({ message: 'Invalid userId, productId, or stock value' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (stock === 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                const product = await Product.findById(productId);
                if (stock > product.availableStock) return res.status(400).json({ message: 'Insufficient stock' });
                cart.items[itemIndex].stock = stock;
            }
        } else {
            cart.items.push({ productId, stock });
        }

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart', error });
    }
};

const HandleDeleteCartItem = async (req, res) => {
    const { userId, productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Invalid userId or productId' });
    }

    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
            await cart.save();
            res.json({ message: 'Product removed from cart', cart });
        } else {
            res.status(404).json({ message: 'Product not found in cart' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting product from cart', error });
    }
};

export { HandleAddToCart, HandleGetCart, HandleUpdateCart, HandleDeleteCartItem };
