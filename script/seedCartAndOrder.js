/**
 * Seeds a cart for SEED_USER_EMAIL with qty 1 of the seed store's (SEED_STORE_EMAIL) product,
 * ensures default payment card is Visa 4242 (Stripe test), then places one order (same rules as POST /api/order/:userId/place).
 *
 * Requires: MONGO_URI, STRIPE_SECRET_KEY (same Stripe account as seedTestData.js)
 *
 * Run: npm run seed:cart-order
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectMongoDB from "../utils/ConnectDB.js";
import stripe from "../utils/StripeConfig.js";
import { getSeedEmails } from "./seedEmails.js";

import Cart from "../models/CartModel.js";
import Product from "../models/ProductModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import Card from "../models/CardModel.js";
import Order from "../models/OrderModel.js";
import Admin from "../models/AdminModel.js";

const STRIPE_TOK_VISA_4242 = "tok_visa";
const ADMIN_FEE_RATE = 0.05;
const RIDER_FEE_RATE = 0.1;

async function ensureDefaultCard4242(userDoc) {
    const existing = await Card.findOne({ userId: userDoc._id, isDefault: true });
    if (existing?.last4 === "4242") {
        return existing;
    }

    let customerId = userDoc.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: userDoc.email,
            name: userDoc.username,
        });
        customerId = customer.id;
        userDoc.stripeCustomerId = customerId;
        await userDoc.save();
    }

    const pm = await stripe.paymentMethods.create({
        type: "card",
        card: { token: STRIPE_TOK_VISA_4242 },
    });
    await stripe.paymentMethods.attach(pm.id, { customer: customerId });
    await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pm.id },
    });

    const { brand, last4, exp_month, exp_year } = pm.card;
    if (last4 !== "4242") {
        throw new Error(`Expected test card last4 4242, got ${last4}`);
    }

    await Card.deleteMany({ userId: userDoc._id });
    const card = await Card.create({
        userId: userDoc._id,
        stripeCustomerId: customerId,
        stripePaymentMethodId: pm.id,
        brand,
        last4,
        expMonth: exp_month,
        expYear: exp_year,
        isDefault: true,
    });
    console.log("Set default card to Visa 4242 (PM:", pm.id, ")");
    return card;
}

async function placeOrderFromCart(userId, userDoc, deliveryOverrides = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ userId })
            .populate("items.productId", "title price discountPrice stock storeID status")
            .session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            throw new Error("Cart is empty");
        }

        const storeIds = [
            ...new Set(
                cart.items.map((item) => item.productId?.storeID?.toString()).filter(Boolean),
            ),
        ];

        if (storeIds.length !== 1) {
            await session.abortTransaction();
            session.endSession();
            throw new Error("Cart must contain products from a single store only.");
        }

        const storeID = storeIds[0];
        const store = await StoreOwnerModel.findById(storeID).session(session);
        if (!store || !store.storeStatus?.includes("Open")) {
            await session.abortTransaction();
            session.endSession();
            throw new Error("Store is closed. Cannot place order.");
        }

        const orderItems = [];
        for (const item of cart.items) {
            const product = item.productId;
            if (!product || !product.status?.includes("Active")) {
                await session.abortTransaction();
                session.endSession();
                throw new Error(`Product "${product?.title || "item"}" is unavailable.`);
            }
            if (item.stock > product.stock) {
                await session.abortTransaction();
                session.endSession();
                throw new Error(`Insufficient stock for ${product.title}.`);
            }
            const unitPrice = product.discountPrice || product.price;
            orderItems.push({
                productId: product._id,
                quantity: item.stock,
                price: unitPrice,
                storeID: product.storeID,
            });
        }

        const subtotal = orderItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0,
        );

        const riderFare = Number((subtotal * RIDER_FEE_RATE).toFixed(2));
        const adminFee = Number((subtotal * ADMIN_FEE_RATE).toFixed(2));
        const totalAmount = Number((subtotal + riderFare + adminFee).toFixed(2));
        const storePayout = subtotal;

        const card = await Card.findOne({ userId, isDefault: true }).session(session);
        if (!card) {
            await session.abortTransaction();
            session.endSession();
            throw new Error("No default payment card found.");
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
            session.endSession();
            throw new Error(`Payment failed: ${paymentIntent.status}`);
        }

        const lat =
            deliveryOverrides.latitude ??
            userDoc.userLatitude ??
            24.9012;
        const lng =
            deliveryOverrides.longitude ??
            userDoc.userLongitude ??
            67.0011;

        const snapshot = {
            label: deliveryOverrides.label ?? "Home",
            addressLine: deliveryOverrides.addressLine ?? userDoc.addressLine,
            city: deliveryOverrides.city ?? userDoc.city,
            state: deliveryOverrides.state ?? userDoc.state,
            country: deliveryOverrides.country ?? userDoc.country,
            postalCode: deliveryOverrides.postalCode ?? userDoc.postalCode,
            phone: deliveryOverrides.phone ?? userDoc.phone,
            addressId: deliveryOverrides.addressId ?? null,
        };

        const newOrder = new Order({
            userId,
            storeID,
            latitude: lat,
            longitude: lng,
            message: deliveryOverrides.message ?? "Seed order (script)",
            items: orderItems,
            subtotal,
            storePayout,
            totalAmount,
            riderFare,
            adminFare: adminFee,
            paymentId: paymentIntent.id,
            paymentStatus: "Paid",
            status: "PendingStoreAccept",
            userLatitude: lat,
            userLongitude: lng,
            deliveryAddress: snapshot,
        });

        await newOrder.save({ session });

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } },
            { session },
        );

        const anyAdmin = await Admin.findOne().session(session);
        if (anyAdmin) {
            await Admin.findOneAndUpdate(
                { _id: anyAdmin._id },
                { $inc: { adminFare: adminFee } },
                { session },
            );
        } else {
            console.warn("No admin document found — skipped adminFare increment.");
        }

        await session.commitTransaction();
        session.endSession();

        return { order: newOrder, paymentIntent, breakdown: { subtotal, riderFare, adminFee, totalAmount } };
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        throw e;
    }
}

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set");
        process.exit(1);
    }
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is not set");
        process.exit(1);
    }

    const { store: storeEmail, user: userEmail } = getSeedEmails();

    await connectMongoDB();

    const store = await StoreOwnerModel.findOne({ email: storeEmail });
    if (!store) {
        console.error("Store not found:", storeEmail, "— run npm run seed:test-data first.");
        process.exit(1);
    }
    if (!store.storeStatus?.includes("Open")) {
        store.storeStatus = ["Open"];
        await store.save();
        console.log("Opened seed store for order placement.");
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
        console.error("User not found:", userEmail, "— run npm run seed:test-data first.");
        process.exit(1);
    }

    let product = await Product.findOne({ storeID: store._id, slug: "seed-test-product" });
    if (!product) {
        product = await Product.findOne({ storeID: store._id });
    }
    if (!product) {
        console.error("No product for store", storeEmail);
        process.exit(1);
    }
    if (!product.status?.includes("Active")) {
        product.status = ["Active"];
        await product.save();
    }
    if (product.stock < 1) {
        product.stock = 10;
        await product.save();
        console.log("Increased product stock for seed order.");
    }

    await ensureDefaultCard4242(user);

    await Cart.findOneAndUpdate(
        { userId: user._id },
        {
            $set: {
                userId: user._id,
                items: [
                    {
                        productId: product._id,
                        stock: 1,
                        storeID: store._id,
                    },
                ],
            },
        },
        { upsert: true, new: true },
    );

    console.log("Cart set: 1 x", product.title, "| productId:", product._id.toString());

    const result = await placeOrderFromCart(user._id, user);

    console.log("\nOrder created:", result.order._id.toString());
    console.log("Status:", result.order.status);
    console.log("PaymentIntent:", result.paymentIntent.id);
    console.log("Breakdown:", result.breakdown);

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
