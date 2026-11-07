/**
 * Removes seed test users (same emails as seedTestData.js) and related MongoDB docs.
 * Optional: deletes Stripe Connect account + customer when STRIPE_SECRET_KEY is set.
 *
 * Env (same defaults as seed):
 *   MONGO_URI, STRIPE_SECRET_KEY (optional for Stripe cleanup)
 *   SEED_STORE_EMAIL, SEED_USER_EMAIL, SEED_RIDER_EMAIL
 *
 * Run: npm run seed:delete-test-data
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongoDB from "../utils/ConnectDB.js";
import { getSeedEmails } from "./seedEmails.js";

import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import RiderModel from "../models/RiderModel.js";
import ProductModel from "../models/ProductModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
import Card from "../models/CardModel.js";
import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Notifications from "../models/NotificationsModel.js";
import Chat from "../models/ChatModel.js";
import Connection from "../models/ConnectionModel.js";
import Address from "../models/AddressModel.js";
import Payment from "../models/PaymentModel.js";
import Review from "../models/ReviewModel.js";
import RiderReview from "../models/RiderReviewModel.js";

async function deleteStripeResources(storeDoc, userDoc) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.log("STRIPE_SECRET_KEY not set; skipping Stripe API deletes.");
        return;
    }
    const { default: stripe } = await import("../utils/StripeConfig.js");
    try {
        if (storeDoc?.accountID) {
            await stripe.accounts.del(storeDoc.accountID);
            console.log("Deleted Stripe Connect account:", storeDoc.accountID);
        }
    } catch (e) {
        console.warn("Stripe Connect delete:", e.message || e);
    }
    try {
        if (userDoc?.stripeCustomerId) {
            await stripe.customers.del(userDoc.stripeCustomerId);
            console.log("Deleted Stripe customer:", userDoc.stripeCustomerId);
        }
    } catch (e) {
        console.warn("Stripe customer delete:", e.message || e);
    }
}

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set");
        process.exit(1);
    }

    const { store: storeEmail, user: userEmail, rider: riderEmail } = getSeedEmails();
    console.log("Deleting seed data for:", { storeEmail, userEmail, riderEmail });

    await connectMongoDB();

    const store = await StoreOwnerModel.findOne({ email: storeEmail });
    const endUser = await User.findOne({ email: userEmail });
    const rider = await RiderModel.findOne({ email: riderEmail });

    const storeId = store?._id;
    const userId = endUser?._id;
    const riderId = rider?._id;

    const actorIds = [storeId, userId, riderId].filter(Boolean);

    if (actorIds.length === 0) {
        console.log("No seed documents found for those emails. Nothing to delete.");
        await mongoose.disconnect();
        return;
    }

    // --- Graph: connections & chats (involving any of the three)
    const connections = await Connection.find({
        $or: [{ userOne: { $in: actorIds } }, { userTwo: { $in: actorIds } }],
    }).select("_id");
    const connectionIds = connections.map((c) => c._id);

    const chatRes = await Chat.deleteMany({
        $or: [
            { senderID: { $in: actorIds } },
            { recieverID: { $in: actorIds } },
            ...(connectionIds.length ? [{ connectionID: { $in: connectionIds } }] : []),
        ],
    });
    console.log("Deleted chats:", chatRes.deletedCount);

    const connRes = await Connection.deleteMany({ _id: { $in: connectionIds } });
    console.log("Deleted connections:", connRes.deletedCount);

    // --- Notifications
    const notifRes = await Notifications.deleteMany({ userID: { $in: actorIds } });
    console.log("Deleted notifications:", notifRes.deletedCount);

    // --- User-scoped
    if (userId) {
        const cartRes = await Cart.deleteMany({ userId });
        console.log("Deleted carts:", cartRes.deletedCount);
        const cardRes = await Card.deleteMany({ userId });
        console.log("Deleted cards:", cardRes.deletedCount);
        const addrRes = await Address.deleteMany({ userId });
        console.log("Deleted addresses:", addrRes.deletedCount);
        const payRes = await Payment.deleteMany({ userId });
        console.log("Deleted payments:", payRes.deletedCount);
        const revRes = await Review.deleteMany({ userId });
        console.log("Deleted product reviews:", revRes.deletedCount);
        const rrRes = await RiderReview.deleteMany({ user: userId });
        console.log("Deleted rider reviews (by user):", rrRes.deletedCount);
    }

    // --- Orders (user, store, rider roles)
    const orderFilter = [];
    if (userId) orderFilter.push({ userId });
    if (storeId) orderFilter.push({ storeID: storeId });
    if (riderId) {
        orderFilter.push({ assignedRider: riderId }, { rejectedRiders: riderId });
    }
    let orderDeleted = 0;
    if (orderFilter.length) {
        const orderRes = await Order.deleteMany({ $or: orderFilter });
        orderDeleted = orderRes.deletedCount;
    }
    console.log("Deleted orders:", orderDeleted);

    // --- Store-scoped
    let productIds = [];
    if (storeId) {
        productIds = (await ProductModel.find({ storeID: storeId }).select("_id")).map((p) => p._id);
        if (productIds.length) {
            const prodRevRes = await Review.deleteMany({ product: { $in: productIds } });
            console.log("Deleted reviews for seed products:", prodRevRes.deletedCount);
        }
        const subRes = await SubscriptionModel.deleteMany({ storeID: storeId });
        console.log("Deleted subscriptions:", subRes.deletedCount);
        const prodRes = await ProductModel.deleteMany({ storeID: storeId });
        console.log("Deleted products:", prodRes.deletedCount);
    }

    // Stripe before removing DB rows (need accountID / stripeCustomerId)
    await deleteStripeResources(store, endUser);

    // --- Principal documents
    if (storeId) {
        const r = await StoreOwnerModel.deleteOne({ _id: storeId });
        console.log("Deleted store owner:", r.deletedCount);
    } else {
        console.log("Store owner not found — skipped");
    }
    if (userId) {
        const r = await User.deleteOne({ _id: userId });
        console.log("Deleted user:", r.deletedCount);
    } else {
        console.log("User not found — skipped");
    }
    if (riderId) {
        const r = await RiderModel.deleteOne({ _id: riderId });
        console.log("Deleted rider:", r.deletedCount);
    } else {
        console.log("Rider not found — skipped");
    }

    console.log("\nDone.");
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
