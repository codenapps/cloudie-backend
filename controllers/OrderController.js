import mongoose from "mongoose";
import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";
import RiderModel from "../models/RiderModel.js";


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
                storeId: product.storeID,
            };
        });

        console.log(orderItems, "orderItems");


        const totalAmount = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

        const newOrder = new Order({
            userId,
            items: orderItems.map(({ productId, quantity, price }) => ({
                productId,
                quantity,
                price,
            })),
            totalAmount,
            message,
            latitude,
            longitude,
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
            .populate("items.productId", "title price discountPrice productImage")
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
            "title price discountPrice productImage"
        );
        if (!order) return res.status(404).json({ message: "Order not found" });
        console.log(order);

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

const assignOrderToRider = async (orderId) => {
    const order = await Order.findById(orderId);
    if (!order) return null;

    // Skip riders who already rejected this order
    const nextRider = await RiderModel.findOne({
        status: "Active",
        verified: "Accepted",
        _id: { $nin: order.rejectedRiders || [] },
    });

    if (!nextRider) return null;

    order.assignedRider = nextRider._id;
    order.status = "Assigned";
    await order.save();

    return nextRider;
};

const HandleAssignRider = async (req, res) => {
    try {
        const { orderId } = req.params;

        const rider = await assignOrderToRider(orderId);

        if (!rider) {
            const order = await Order.findById(orderId);
            if (order) {
                order.status = "Pending";
                await order.save();
            }
            return res.status(200).json({ message: "No available riders. Order is pending" });
        }

        res.status(200).json({ message: "Order assigned to rider", rider });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const HandleRiderAccept = async (req, res) => {
    try {
        const { orderId, riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!order.assignedRider || order.assignedRider.toString() !== riderId) {
            return res.status(403).json({ message: "This rider is not assigned to the order" });
        }

        order.status = "Shipped";
        await order.save();

        res.status(200).json({ message: "Order accepted", order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const HandleRiderReject = async (req, res) => {
    try {
        const { orderId, riderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (!order.assignedRider || order.assignedRider.toString() !== riderId) {
            return res.status(403).json({ message: "This rider is not assigned to the order" });
        }

        order.rejectedRiders = order.rejectedRiders || [];
        order.rejectedRiders.push(riderId);
        order.assignedRider = null;
        order.status = "Pending";
        await order.save();

        const nextRider = await assignOrderToRider(orderId);

        if (!nextRider) {
            return res.status(200).json({ message: "Order rejected. No available riders now.", order });
        }

        res.status(200).json({ message: "Order reassigned to next rider", order, nextRider });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const HandleGetRiderOrders = async (req, res) => {
    try {
        const { riderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(riderId)) {
            return res.status(400).json({ message: "Invalid Rider ID" });
        }

        const orders = await Order.find({
            assignedRider: riderId,
            status: { $in: ["Assigned", "Shipped"] },
        }).sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(200).json({ message: "No active orders for this rider." });
        }

        res.status(200).json({
            totalOrders: orders.length,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export {
    HandlePlaceOrder, HandleGetUserOrders, HandleGetSingleOrder, HandleUpdateOrderStatus, HandleAssignRider, HandleRiderAccept, HandleRiderReject, HandleGetRiderOrders,
};
