import mongoose from "mongoose";
import Product from "../models/ProductModel.js";
import Cart from "../models/CartModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";

const HandleAddToCart = async (req, res) => {
    try {
        const { userId, productId, stock, replace } = req.body;
        const session = await mongoose.startSession();
        session.startTransaction();

        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Product not found' });
        }

        const store = await StoreOwnerModel.findById(product.storeID).session(session);
        if (!store || !store.storeStatus?.includes('Open')) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'This store is closed. You cannot add these products right now.' });
        }

        let cart = await Cart.findOne({ userId }).session(session);
        const storeID = product.storeID;

        if (cart?.items?.length) {
            const cartStoreId = cart.items[0].storeID?.toString();
            if (cartStoreId && cartStoreId !== storeID.toString()) {
                if (!replace) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(409).json({
                        code: 'DIFFERENT_STORE',
                        message: 'Your cart has items from another store. Replace cart to continue.',
                        currentStoreId: cartStoreId,
                    });
                }
                cart.items = [];
            }
        }

        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, stock, storeID }] });
        } else {
            const itemIndex = cart.items.findIndex(
                (item) => item.productId.toString() === productId,
            );
            if (itemIndex > -1) {
                cart.items[itemIndex].stock += stock;
            } else {
                cart.items.push({ productId, stock, storeID });
            }
        }

        await cart.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding to cart', error });
    }
};

const HandleGetCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId })
        .populate('items.productId', 'title discountPrice price variations productImage galleryImages status stock storeID');

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error });
    }
};

const HandleUpdateCart = async (req, res) => { 
    try {
        const { userId } = req.params;
        const { productId, stock } = req.body;
    
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId) || stock < 0) {
            return res.status(400).json({ message: 'Invalid userId, productId, or stock value' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex > -1) {
            if (stock === 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                const product = await Product.findById(productId);
                if (!product) return res.status(404).json({ message: 'Product not found' });
                if (stock > product.stock) return res.status(400).json({ message: 'Insufficient stock' });
                cart.items[itemIndex].stock = stock;
            }
        } else {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        await cart.save();
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart', error });
    }
};

const HandleDeleteCartItem = async (req, res) => {    
    try {
        const { userId, productId } = req.params;
    
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid userId or productId' });
        }
        
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
