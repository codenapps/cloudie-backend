import mongoose from "mongoose";
import Cart from "../models/CartModel.js";
import Order from "../models/OrderModel.js";
import Product from "../models/ProductModel.js";
import RiderModel from "../models/RiderModel.js";
import Card from "../models/CardModel.js";
import Stripe from 'stripe';
import Riders from "../models/RiderModel.js";

const stripe = new Stripe("sk_test_51QePvkArP8SrFQvbyuj6Tve2Nw504Ef9beVL24eFCUjgprmGlfnjEQpJkEChOKMlSBeK4vzoed5OJ3oUsDZeYvzC00oVh0ZEe1");


// const HandlePlaceOrder = async (req, res) => {
//     const { latitude, longitude, message } = req.body;
//     const { userId } = req.params;
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const cart = await Cart.findOne({ userId })
//             .populate("items.productId", "title price discountPrice stock storeID")
//             .session(session);

//         if (!cart || cart.items.length === 0) {
//             await session.abortTransaction();
//             return res.status(404).json({ message: "No items in cart" });
//         }

//         const orderItems = cart.items.map((item) => {
//             const product = item.productId;
//             const unitPrice = product.discountPrice || product.price;
//             const subtotal = unitPrice * item.stock;

//             return {
//                 productId: product._id,
//                 quantity: item.stock,
//                 price: unitPrice,
//                 subtotal,
//                 storeID: product.storeID,
//             };
//         });

//         const totalAmount = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

//         const card = await Card.findOne({ userId, isDefault: true });
//         if (!card) {
//             await session.abortTransaction();
//             return res.status(400).json({ message: "No default card found. Please add a card first." });
//         }

//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: Math.round(totalAmount * 100),
//             currency: "usd",
//             customer: card.stripeCustomerId,
//             payment_method: card.stripePaymentMethodId,
//             off_session: true,
//             confirm: true,
//         });

//         if (paymentIntent.status !== "succeeded") {
//             await session.abortTransaction();
//             return res.status(400).json({ message: "Payment failed", paymentIntent });
//         }

//         const newOrder = new Order({
//             userId,
//             latitude,
//             longitude,
//             message,
//             items: orderItems.map(({ productId, quantity, price, storeID }) => ({
//                 productId,
//                 quantity,
//                 price,
//                 storeID
//             })),
//             totalAmount,
//             status: "InProgress",
//         });

//         await newOrder.save({ session });

//         for (const item of orderItems) {
//             await Product.findByIdAndUpdate(
//                 item.productId,
//                 { $inc: { stock: -item.quantity } },
//                 { session }
//             );
//         }

//         await Cart.findOneAndUpdate(
//             { userId },
//             { $set: { items: [] } },
//             { session }
//         );

//         await session.commitTransaction();
//         session.endSession();

//         res.status(201).json({
//             message: "Order placed and payment successful",
//             order: newOrder,
//             paymentIntent
//         });

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         console.error(error);

//         if (error.type === "StripeCardError") {
//             return res.status(400).json({ message: error.message });
//         }

//         res.status(500).json({ message: "Error placing order", error });
//     }
// };

const HandlePlaceOrder = async (req, res) => {
    const { latitude, longitude, message } = req.body;
    const { userId } = req.params;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
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
            const subtotal = unitPrice * item.stock;

            return {
                productId: product._id,
                quantity: item.stock,
                price: unitPrice,
                subtotal,
                storeID: product.storeID,
            };
        });

        const totalAmount = orderItems.reduce((acc, item) => acc + item.subtotal, 0);

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
            return res.status(400).json({
                message: "Payment failed",
                paymentIntent,
            });
        }

        const newOrder = new Order({
            userId,
            latitude,
            longitude,
            message,
            items: orderItems.map(({ productId, quantity, price, storeID }) => ({
                productId,
                quantity,
                price,
                storeID,
            })),
            totalAmount,
            paymentId: paymentIntent.id,
            paymentStatus: "Paid",
            status: "Pending",
            userLatitude: latitude,
            userLongitude: longitude,
        });

        await newOrder.save({ session });

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { session }
            );
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { session });

        const rider = await Riders.findOne({
            status: "Active",
            verified: "Accepted",
        })

        if (rider) {
            newOrder.assignedRider = rider._id;
            newOrder.riderUsername = rider.username;
            newOrder.status = "Assigned";
        }

        await newOrder.save({ session });

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

        if (error.type === "StripeCardError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({
            message: "An error occurred while placing the order.",
            error: error.message,
        });
    }
};

const HandleGetUserOrders = async (req, res) => {
    const { userId } = req.params;

    try {
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
    const { storeID } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const skip = (page - 1) * limit;

        const orders = await Order.find({ "items.storeID": storeID })
            .populate("items.productId", "title price discountPrice productImage")
            .populate("userId", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        if (!orders.length) {
            return res.status(200).json({ message: "No orders found for this store." });
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving store orders", error });
    }
};

const HandleGetAllsUserOrdersStore = async (req, res) => {
    const { adminId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const skip = (pageNumber - 1) * limitNumber;

        const orders = await Order.find()
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 })
            .populate("userId", "username email");;

        const totalOrders = await Order.countDocuments();

        if (!orders.length) {
            return res.status(200).json({ message: "No orders found." });
        }

        console.log(totalOrders.length);


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
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).populate(
            "items.productId",
            "title price discountPrice productImage riderUsername"
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
    // try {
    //     const { orderId } = req.params;

    //     const rider = await Riders.findOne({
    //         status: "Active",
    //         verified: "Accepted"
    //     });

    //     const order = await Order.findById(orderId);
    //     if (!order) {
    //         return res.status(404).json({ message: "Order not found" });
    //     }

    //     if (!rider) {
    //         order.status = "Pending";
    //         await order.save();
    //         return res.status(200).json({ message: "No available riders. Order is pending" });
    //     }

    //     order.riderId = rider._id;
    //     order.status = "Assigned";
    //     await order.save();

    //     res.status(200).json({
    //         message: "Order assigned to rider",
    //         rider: {
    //             id: rider._id,
    //             username: rider.username,
    //             phone: rider.phone,
    //             email: rider.email,
    //         },
    //         orderId: order._id
    //     });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: "Internal Server Error", error: error.message });
    // }
};

const HandleRiderAccept = async (req, res) => {
    // try {
    //     const { orderId, riderId } = req.body;

    //     const order = await Order.findById(orderId);
    //     if (!order) return res.status(404).json({ message: "Order not found" });

    //     if (!order.assignedRider || order.assignedRider.toString() !== riderId) {
    //         return res.status(403).json({ message: "This rider is not assigned to the order" });
    //     }

    //     order.status = "Shipped";
    //     await order.save();

    //     res.status(200).json({ message: "Order accepted", order });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: "Internal Server Error" });
    // }
};

const HandleRiderReject = async (req, res) => {
    // try {
    //     const { orderId, riderId } = req.body;

    //     const order = await Order.findById(orderId);
    //     if (!order) return res.status(404).json({ message: "Order not found" });

    //     if (!order.assignedRider || order.assignedRider.toString() !== riderId) {
    //         return res.status(403).json({ message: "This rider is not assigned to the order" });
    //     }

    //     order.rejectedRiders = order.rejectedRiders || [];
    //     order.rejectedRiders.push(riderId);
    //     order.assignedRider = null;
    //     order.status = "Pending";
    //     await order.save();

    //     const nextRider = await assignOrderToRider(orderId);

    //     if (!nextRider) {
    //         return res.status(200).json({ message: "Order rejected. No available riders now.", order });
    //     }

    //     res.status(200).json({ message: "Order reassigned to next rider", order, nextRider });
    // } catch (error) {
    //     console.error(error);
    //     res.status(500).json({ message: "Internal Server Error" });
    // }
};

// const HandleGetRiderOrders = async (req, res) => {
//     try {
//         const { riderId } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(riderId)) {
//             return res.status(400).json({ message: "Invalid Rider ID" });
//         }

//         const orders = await Order.find({
//             assignedRider: riderId,
//             status: { $in: ["Assigned", "Shipped"] },
//         }).sort({ createdAt: -1 });

//         if (orders.length === 0) {
//             return res.status(200).json({ message: "No active orders for this rider." });
//         }

//         res.status(200).json({
//             totalOrders: orders.length,
//             orders,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

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
    HandlePlaceOrder, HandleGetUserOrders, HandleGetUserOrdersStore, HandleGetSingleOrder, HandleUpdateOrderStatus, HandleAssignRider, HandleRiderAccept, HandleRiderReject, HandleGetRiderOrders, HandleGetAllsUserOrdersStore,
};
