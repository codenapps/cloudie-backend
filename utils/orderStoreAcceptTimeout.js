import mongoose from "mongoose";
import Stripe from "stripe";
import Admin from "../models/AdminModel.js";
import Order from "../models/OrderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";

const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY ||
        "sk_test_51QePvkArP8SrFQvbyuj6Tve2Nw504Ef9beVL24eFCUjgprmGlfnjEQpJkEChOKMlSBeK4vzoed5OJ3oUsDZeYvzC00oVh0ZEe1",
);

const minutes = Math.max(
    1,
    parseInt(process.env.STORE_ACCEPT_TIMEOUT_MINUTES, 10) || 15,
);
const ACCEPT_TIMEOUT_MS = minutes * 60 * 1000;
const TICK_MS = 60 * 1000;

const cancelStaleOrder = async (orderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findOne({
            _id: orderId,
            status: "PendingStoreAccept",
        }).session(session);

        if (!order) {
            await session.abortTransaction();
            return;
        }

        if (order.paymentId) {
            await stripe.refunds.create({ payment_intent: order.paymentId });
        }

        order.status = "Cancelled";
        order.paymentStatus = "Unpaid";
        await order.save({ session });

        await Admin.findOneAndUpdate(
            {},
            { $inc: { adminFare: -(order.adminFare || 0) } },
            { session },
        );

        await StoreOwnerModel.findByIdAndUpdate(
            order.storeID,
            { $set: { storeStatus: ["Close"] } },
            { session },
        );

        await session.commitTransaction();
    } catch (err) {
        await session.abortTransaction();
        console.error("orderStoreAcceptTimeout:", orderId, err.message);
    } finally {
        session.endSession();
    }
};

export const expireUnansweredStoreOrders = async () => {
    const cutoff = new Date(Date.now() - ACCEPT_TIMEOUT_MS);
    const stale = await Order.find({
        status: "PendingStoreAccept",
        createdAt: { $lt: cutoff },
    })
        .select("_id")
        .limit(25)
        .lean();

    for (const row of stale) {
        await cancelStaleOrder(row._id);
    }
};

export const startStoreOrderAcceptTimeoutMonitor = () => {
    expireUnansweredStoreOrders().catch((err) =>
        console.error("orderStoreAcceptTimeout:", err.message),
    );
    setInterval(() => {
        expireUnansweredStoreOrders().catch((err) =>
            console.error("orderStoreAcceptTimeout:", err.message),
        );
    }, TICK_MS);
};
