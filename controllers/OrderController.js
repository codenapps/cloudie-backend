import mongoose from "mongoose";
import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";


const HandlePlaceOrder = async (req, res) => {
    const { userId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ userId })
            .populate("items.productId", "title price discountPrice stock")
            .session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "No items in cart" });
        }

        const orderItems = cart.items.map((item) => {
            const product = item.productId;
            const unitPrice = product.discountPrice || product.price;
            const subtotal = unitPrice * item.stock;
            return {
                productId: product._id,
                quantity: item.stock,
                price: unitPrice,
                subtotal,
            };
        });

        const totalAmount = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

        const newOrder = new Order({
            userId,
            items: orderItems.map(({ productId, quantity, price }) => ({
                productId,
                quantity,
                price,
            })),
            totalAmount,
            status: "Pending",
        });

        await newOrder.save({ session });

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { session }
            );
        }

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "Order placed successfully",
            order: newOrder,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: "Error placing order", error });
    }
};

const HandleGetUserOrders = async (req, res) => {
    const { userId } = req.params;

    try {
        const orders = await Order.find({ userId })
            .populate("items.productId", "title price discountPrice")
            .sort({ createdAt: -1 });

        if (!orders.length) {
            return res.status(200).json({ message: "No orders found for this user." });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving orders", error });
    }
};

const HandleGetSingleOrder = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).populate(
            "items.productId",
            "title price discountPrice"
        );
        if (!order) return res.status(404).json({ message: "Order not found" });

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching order", error });
    }
};

const HandleUpdateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ message: "Order not found" });

        res.json({ message: `Order status updated to ${status}`, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating order status", error });
    }
};


export { HandlePlaceOrder, HandleGetUserOrders, HandleGetSingleOrder, HandleUpdateOrderStatus };
