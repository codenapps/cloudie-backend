/**
 * Seeds minimal test data: one StoreOwner, one User, one Rider, one Product.
 * - Store: admin-verified (Accepted), OTP verified, Active, Open, with Trial subscription when possible
 * - User: OTP verified
 * - Rider: admin-verified (Accepted), OTP verified, Active
 *
 * Environment (optional):
 *   MONGO_URI          — required (same as app)
 *   SEED_TEST_PASSWORD — default: TestSeed123!
 *   SEED_STORE_EMAIL   — default: seed.store@test.local
 *   SEED_USER_EMAIL    — default: seed.user@test.local
 *   SEED_RIDER_EMAIL   — default: seed.rider@test.local
 *
 * Stripe (test mode — requires STRIPE_SECRET_KEY in .env):
 *   Provisions a Connect custom account for the store with card 4000056655665556 (debit US test)
 *   and attaches 4242424242424242 to the seed user as default payment method.
 *
 * Run: npm run seed:test-data
 *      node script/seedTestData.js
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import connectMongoDB from "../utils/ConnectDB.js";
import stripe from "../utils/StripeConfig.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import RiderModel from "../models/RiderModel.js";
import ProductModel from "../models/ProductModel.js";
import CategoryModel from "../models/CategoryModel.js";
import PlanModel from "../models/PlanModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
import Card from "../models/CardModel.js";
import { getSeedEmails } from "./seedEmails.js";

const PLACEHOLDER_IMG =
    "https://res.cloudinary.com/dhuhpslek/image/upload/fl_preserve_transparency/v1721946752/imageszzzz_sn7njl.jpg?_s=public-apps";

/** Karachi test coords — each pair ~4–5 km from the others (same city) */
const KARACHI_STORE = { lat: 24.8607, lng: 67.0011 }; // near Saddar / city core
const KARACHI_USER = { lat: 24.9012, lng: 67.0011 }; // ~4.5 km N of store
const KARACHI_RIDER = { lat: 24.8607, lng: 67.0457 }; // ~4.5 km E of store

/** Stripe test tokens — same PANs as docs (no raw numbers; works without raw-card API access) */
const STRIPE_TOK = {
    visa4242: "tok_visa", // 4242 4242 4242 4242
    visaDebit4000: "tok_visa_debit", // 4000 0566 5566 5556
};

const passwordPlain = process.env.SEED_TEST_PASSWORD || "TestSeed123!";
const { store: STORE_EMAIL, user: USER_EMAIL, rider: RIDER_EMAIL } = getSeedEmails();

/** Connect account country must match test bank; app DB still uses PK for display/search */
const SEED_STRIPE_CONNECT_COUNTRY = "US";

async function ensureTrialPlan() {
    let plan = await PlanModel.findOne({ duration: ["Trial"] });
    if (!plan) {
        plan = await PlanModel.create({
            planName: "__seed_trial_plan__",
            description: "Auto-created by seedTestData for Trial subscriptions",
            duration: ["Trial"],
            price: 0,
        });
        console.log("Created Trial plan:", plan._id.toString());
    }
    return plan;
}

async function ensureUncategorizedCategory() {
    let cat = await CategoryModel.findOne({ name: "uncategorized" });
    if (!cat) {
        cat = await CategoryModel.create({
            name: "uncategorized",
            slug: "uncategorized",
            status: ["Active"],
            catImage: PLACEHOLDER_IMG,
        });
        console.log('Created default "uncategorized" category:', cat._id.toString());
    }
    return cat;
}

async function ensureStoreSubscription(storeId, accountID) {
    if (!accountID) {
        throw new Error(
            "Cannot create subscription: store Stripe accountID is missing. Check STRIPE_SECRET_KEY and Stripe provisioning logs."
        );
    }
    const trialPlan = await ensureTrialPlan();
    const existing = await SubscriptionModel.findOne({
        storeID: storeId,
        duration: ["Trial"],
        status: ["Active"],
    });
    if (existing) {
        if (existing.accountID !== accountID) {
            existing.accountID = accountID;
            await existing.save();
            console.log("Updated subscription accountID for store:", storeId.toString());
        }
        return existing;
    }
    const sub = await SubscriptionModel.create({
        storeID: storeId,
        planID: trialPlan._id,
        accountID,
        transferID: "",
        duration: ["Trial"],
        status: ["Active"],
    });
    console.log("Created Trial subscription for store:", sub._id.toString());
    return sub;
}

/**
 * Creates or refreshes Stripe Connect + debit card for seed store (matches app signup flow country/currency).
 */
async function provisionStoreStripeConnect(store) {
    const email = store.email;
    const dobParts = String(store.dob || "1990-01-15").split("-");
    const day = Number(dobParts[2]) || 15;
    const month = Number(dobParts[1]) || 1;
    const year = Number(dobParts[0]) || 1990;

    let accountId = store.accountID;
    if (!accountId) {
        const account = await stripe.accounts.create({
            country: SEED_STRIPE_CONNECT_COUNTRY,
            type: "custom",
            email,
            business_type: "individual",
            business_profile: { url: "https://cloudie.com" },
            individual: {
                first_name: store.storeName?.slice(0, 24) || "SeedStore",
                last_name: " ",
                email,
                phone: "+15551234567",
                dob: { day, month, year },
                // Stripe Connect expects a valid US address for US accounts (DB keeps Karachi / PK)
                address: {
                    line1: "123 Market Street",
                    city: "San Francisco",
                    state: "CA",
                    country: SEED_STRIPE_CONNECT_COUNTRY,
                    postal_code: "94103",
                },
                ssn_last_4: store.ssn_last_4 ?? 1234,
            },
            capabilities: {
                transfers: { requested: true },
            },
            settings: {
                payouts: { debit_negative_balances: true },
            },
        });
        accountId = account.id;
        await stripe.accounts.update(accountId, {
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: "8.8.8.8",
            },
        });
        console.log("Created Stripe Connect account for seed store:", accountId);
    }

    let externalId = store.cardID;
    if (!externalId) {
        const external = await stripe.accounts.createExternalAccount(accountId, {
            external_account: STRIPE_TOK.visaDebit4000, // test tok = Visa debit 4000056655665556
            default_for_currency: true,
        });
        externalId = external.id;
        console.log("Attached Stripe test Visa debit (4000056655665556 tok) to Connect account:", externalId);
    }

    store.accountID = accountId;
    store.cardID = externalId;
    await store.save();
    return store;
}

async function provisionUserPaymentMethod(userDoc) {
    let customerId = userDoc.stripeCustomerId;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: userDoc.email,
            name: userDoc.username,
        });
        customerId = customer.id;
        userDoc.stripeCustomerId = customerId;
        await userDoc.save();
        console.log("Created Stripe customer for seed user:", customerId);
    }

    const pm = await stripe.paymentMethods.create({
        type: "card",
        card: { token: STRIPE_TOK.visa4242 },
    });
    await stripe.paymentMethods.attach(pm.id, { customer: customerId });
    await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: pm.id },
    });
    const { brand, last4, exp_month, exp_year } = pm.card;

    await Card.deleteMany({ userId: userDoc._id });
    await Card.create({
        userId: userDoc._id,
        stripeCustomerId: customerId,
        stripePaymentMethodId: pm.id,
        brand,
        last4,
        expMonth: exp_month,
        expYear: exp_year,
        isDefault: true,
    });
    console.log("Attached default test Visa 4242… for seed user (PM:", pm.id, ")");
}

async function upsertStoreOwner(hash) {
    const doc = {
        storeName: "Seed Test Store",
        email: STORE_EMAIL,
        password: hash,
        w9form: PLACEHOLDER_IMG,
        description: "Seed test store (script-generated)",
        city: "Karachi",
        state: "Sindh",
        country: "PK",
        addressLine: "Plot 12-C, Main Khayaban-e-Jami, DHA Phase 7",
        postalCode: 75500,
        phone: "+923001234566",
        dob: "1990-01-15",
        identity_back: "seed-identity-back",
        identity_front: "seed-identity-front",
        ssn_last_4: 1234,
        categories: "snack-seller",
        storeLatitude: KARACHI_STORE.lat,
        storeLongitude: KARACHI_STORE.lng,
        accountID: "",
        cardID: "",
        verified: ["Accepted"],
        isOtpVerified: true,
        status: ["Active"],
        storeStatus: ["Open"],
        logo: PLACEHOLDER_IMG,
    };

    let store = await StoreOwnerModel.findOne({ email: STORE_EMAIL });
    if (store) {
        Object.assign(store, doc);
        await store.save();
        console.log("Updated existing store owner:", STORE_EMAIL);
    } else {
        store = await StoreOwnerModel.create(doc);
        console.log("Created store owner:", STORE_EMAIL);
    }

    return store;
}

async function upsertEndUser(hash) {
    const doc = {
        username: "Seed Test User",
        email: USER_EMAIL,
        password: hash,
        city: "Karachi",
        state: "Sindh",
        country: "PK",
        addressLine: "Street 10, Block B, North Nazimabad",
        postalCode: 74600,
        phone: "+923001234567",
        userLatitude: KARACHI_USER.lat,
        userLongitude: KARACHI_USER.lng,
        isOtpVerified: true,
        role: ["User"],
    };

    let u = await User.findOne({ email: USER_EMAIL });
    if (u) {
        Object.assign(u, doc);
        await u.save();
        console.log("Updated existing user:", USER_EMAIL);
    } else {
        u = await User.create(doc);
        console.log("Created user:", USER_EMAIL);
    }
    return u;
}

async function upsertRider(hash) {
    const doc = {
        username: "Seed Test Rider",
        email: RIDER_EMAIL,
        password: hash,
        w9form: PLACEHOLDER_IMG,
        city: "Karachi",
        state: "Sindh",
        country: "PK",
        addressLine: "Street 8, Badar Commercial, DHA Phase 5",
        postalCode: "75500",
        phone: 3001234568,
        verified: ["Accepted"],
        isOtpVerified: true,
        vehicleType: "Bike",
        status: ["Active"],
        riderLatitude: KARACHI_RIDER.lat,
        riderLongitude: KARACHI_RIDER.lng,
        riderFare: 0,
        role: ["Rider"],
    };

    let r = await RiderModel.findOne({ email: RIDER_EMAIL });
    if (r) {
        Object.assign(r, doc);
        await r.save();
        console.log("Updated existing rider:", RIDER_EMAIL);
    } else {
        r = await RiderModel.create(doc);
        console.log("Created rider:", RIDER_EMAIL);
    }
    return r;
}

async function ensureProduct(storeId, categoryId) {
    const baseSlug = "seed-test-product";
    const existing = await ProductModel.findOne({ storeID: storeId, slug: baseSlug });
    if (existing) {
        console.log("Product already exists:", baseSlug);
        return existing;
    }
    const p = await ProductModel.create({
        storeID: storeId,
        title: "Seed Test Product",
        desc: "Test product created by seedTestData.js",
        slug: baseSlug,
        isVariable: false,
        price: 9.99,
        discountPrice: null,
        stock: 50,
        category: [categoryId],
        netWeight: "200g",
        status: ["Active"],
        productImage: PLACEHOLDER_IMG,
        galleryImages: [PLACEHOLDER_IMG],
    });
    console.log("Created product:", p.title, p._id.toString());
    return p;
}

async function main() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set");
        process.exit(1);
    }
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is not set (required to provision test cards / Connect account)");
        process.exit(1);
    }

    await connectMongoDB();
    const hash = await bcrypt.hash(passwordPlain, 12);

    const cat = await ensureUncategorizedCategory();
    let store = await upsertStoreOwner(hash);
    store = await provisionStoreStripeConnect(store);
    await ensureStoreSubscription(store._id, store.accountID);

    const user = await upsertEndUser(hash);
    await provisionUserPaymentMethod(user);

    await upsertRider(hash);
    await ensureProduct(store._id, cat._id);

    console.log("\n--- Seed complete ---");
    console.log("Password (all three):", passwordPlain);
    console.log("Store owner:", STORE_EMAIL, "| id:", store._id.toString());
    console.log("User:       ", USER_EMAIL);
    console.log("Rider:      ", RIDER_EMAIL);
    console.log(
        "Note: Stripe Connect uses country",
        SEED_STRIPE_CONNECT_COUNTRY,
        "for test bank 4000056655665556; app fields use PK / Karachi."
    );
    console.log("\nKarachi coordinates (approx. spacing ~4–5 km):");
    console.log("  Store:", KARACHI_STORE.lat, KARACHI_STORE.lng);
    console.log("  User: ", KARACHI_USER.lat, KARACHI_USER.lng);
    console.log("  Rider:", KARACHI_RIDER.lat, KARACHI_RIDER.lng);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
