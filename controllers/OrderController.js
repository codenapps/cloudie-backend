import mongoose from "mongoose";
import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";
import RiderModel from "../models/RiderModel.js";
import Card from "../models/CardModel.js";
import Stripe from 'stripe';
import Riders from "../models/RiderModel.js";
import Admin from "../models/AdminModel.js";
const stripe = new Stripe("sk_test_51QePvkArP8SrFQvbyuj6Tve2Nw504Ef9beVL24eFCUjgprmGlfnjEQpJkEChOKMlSBeK4vzoed5OJ3oUsDZeYvzC00oVh0ZEe1");


const HandlePlaceOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { latitude, longitude, message } = req.body;
        const { userId } = req.params;


        const cart = await Cart.findOne({ userId })
            .populate("items.productId", "title price discountPrice stock storeID")
            .session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Your cart is empty" });
        }

        const orderItems = cart.items.map((item) => {
            const product = item.productId;
            const unitPrice = product.discountPrice || product.price;

            return {
                productId: product._id,
                quantity: item.stock,
                price: unitPrice,
                storeID: product.storeID,
            };
        });

        let totalAmount = orderItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        const riderFare = totalAmount * 0.10;
        const adminFee = totalAmount * 0.05;

        totalAmount = totalAmount + riderFare + adminFee;

        const card = await Card.findOne({ userId, isDefault: true });
        if (!card) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "No default payment card found. Please add or set a default card first.",
            });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100),
            currency: "usd",
            customer: card.stripeCustomerId,
            payment_method: card.stripePaymentMethodId,
            off_session: true,
            confirm: true,
        });

        if (paymentIntent.status !== "succeeded") {
            await session.abortTransaction();
            return res.status(400).json({ message: "Payment failed" });
        }

        let newOrder = new Order({
            userId,
            latitude,
            longitude,
            message,
            items: orderItems,
            totalAmount,
            riderFare,
            adminFare: adminFee,
            paymentId: paymentIntent.id,
            paymentStatus: "Paid",
            status: "Pending",
            userLatitude: latitude,
            userLongitude: longitude,
        });

        const rider = await Riders.findOne({
            status: "Active",
            verified: "Accepted",
        });

        if (!rider) {
            await session.abortTransaction();
            session.endSession();

            return res.status(200).json({
                status: "Assigning",
                orderCreated: false,
                message: "No rider available right now.",
            });
        }

        newOrder.assignedRider = rider._id;
        newOrder.riderUsername = rider.username;
        newOrder.status = "Assigned";

        newOrder.items = newOrder.items.map((item) => ({
            ...item.toObject(),
            riderID: rider._id,
        }));

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

        if (rider) {
            await Riders.findByIdAndUpdate(
                rider._id,
                { $inc: { riderFare: riderFare } },
                { session }
            );
        }

        await Admin.findOneAndUpdate(
            {},
            { $inc: { adminFare: adminFee } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message: rider
                ? "Order placed successfully and assigned to rider."
                : "Order placed successfully. Waiting for rider assignment.",
            order: newOrder,
            rider: rider
                ? {
                    id: rider._id,
                    username: rider.username,
                    phone: rider.phone,
                    email: rider.email,
                }
                : null,
            paymentIntent,
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error placing order:", error);

        return res.status(500).json({
            message: "An error occurred while placing the order.",
            error: error.message,
        });
    }
};

const HandleGetUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ userId })
            .populate("items.productId", "title price discountPrice productImage")
            .populate("assignedRider", "username email phone vehicleType profile_image status verified")

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

const HandleGetUserOrdersStore = async (req, res) => {
    try {
        const { storeID } = req.params;
        const { page = 1, limit = 10, keyword = "" } = req.query;

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const storeObjectId = new mongoose.Types.ObjectId(storeID);

        const pipeline = [
            { $match: { "items.storeID": storeObjectId } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product",
                },
            },
            { $unwind: "$items.product" },
        ];

        if (keyword) {
            pipeline.push({
                $match: {
                    $or: [
                        { "items.product.title": { $regex: keyword, $options: "i" } },
                        { "user.username": { $regex: keyword, $options: "i" } },
                    ],
                },
            });
        }

        pipeline.push({
            $group: {
                _id: "$_id",
                userId: { $first: "$user" },
                items: { $push: "$items" },
                totalAmount: { $first: "$totalAmount" },
                status: { $first: "$status" },
                message: { $first: "$message" },
                userLatitude: { $first: "$userLatitude" },
                userLongitude: { $first: "$userLongitude" },
                latitude: { $first: "$latitude" },
                longitude: { $first: "$longitude" },
                assignedRider: { $first: "$assignedRider" },
                riderUsername: { $first: "$riderUsername" },
                rejectedRiders: { $first: "$rejectedRiders" },
                paymentId: { $first: "$paymentId" },
                paymentStatus: { $first: "$paymentStatus" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
            },
        });

        pipeline.push({ $sort: { createdAt: -1 } });

        pipeline.push({ $skip: skip }, { $limit: limitNumber });

        const orders = await Order.aggregate(pipeline);

        const countPipeline = [
            { $match: { "items.storeID": storeObjectId } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "items.product",
                },
            },
            { $unwind: "$items.product" },
        ];

        if (keyword) {
            countPipeline.push({
                $match: {
                    $or: [
                        { "items.product.title": { $regex: keyword, $options: "i" } },
                        { "user.username": { $regex: keyword, $options: "i" } },
                    ],
                },
            });
        }

        countPipeline.push({ $group: { _id: "$_id" } });

        const totalOrdersResult = await Order.aggregate(countPipeline);
        const totalOrders = totalOrdersResult.length;

        if (!orders.length) {
            return res.status(200).json({ message: "No orders found for this store." });
        }

        res.status(200).json({
            page: pageNumber,
            totalPages: Math.ceil(totalOrders / limitNumber),
            totalOrders,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving store orders", error: error.message });
    }
};

const HandleGetAllsUserOrdersStore = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { page = 1, limit = 10, keyword = "" } = req.query;
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let matchStage = {};
        if (keyword) {
            matchStage = {
                $or: [
                    { "user.username": { $regex: keyword, $options: "i" } },
                    { "user.email": { $regex: keyword, $options: "i" } }
                ]
            };
        }

        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            ...(keyword ? [{ $match: matchStage }] : []),

            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNumber }
        ]);

        const totalOrdersResult = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },

            ...(keyword ? [{ $match: matchStage }] : []),

            { $count: "total" }
        ]);

        const totalOrders = totalOrdersResult[0]?.total || 0;

        res.status(200).json({
            totalOrders,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalOrders / limitNumber),
            pageSize: orders.length,
            orders,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving store orders", error });
    }
};

const HandleGetSingleOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate("userId", "username email phone addressLine")
            .populate("items.productId", "title price discountPrice productImage width height length netWeight")
            .populate("items.storeID", "storeLatitude storeLongitude storeName logo addressLine")
            .populate("assignedRider", "riderLatitude riderLongitude username phone profile_image vehicleType"); // 🔥 Rider outside items

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching order", error });
    }
};

const HandleUpdateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
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

const HandleGetRiderOrders = async (req, res) => {
    try {
        const { riderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(riderId)) {
            return res.status(400).json({ message: "Invalid Rider ID" });
        }

        const orders = await Order.find({
            riderId: riderId,
            status: { $in: ["Assigned", "Shipped"] }
        })
            .populate("items.productId", "title price discountPrice stock storeID")
            .populate({
                path: "riderId",
                select: "username email role verified status",
                match: {
                    verified: { $in: ["Accepted"] },
                    status: { $in: ["Active"] }
                }
            })
            .sort({ createdAt: -1 });

        // Filter out orders where riderId didn't match the populate
        const validOrders = orders.filter(order => order.riderId);

        if (validOrders.length === 0) {
            return res.status(200).json({ message: "No active orders for this rider." });
        }

        res.status(200).json({
            totalOrders: validOrders.length,
            orders: validOrders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


export {
    HandlePlaceOrder, HandleGetUserOrders, HandleGetUserOrdersStore, HandleGetSingleOrder, HandleUpdateOrderStatus, HandleGetRiderOrders, HandleGetAllsUserOrdersStore,
};
