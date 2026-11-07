import SubscriptionModel from "../models/SubscriptionModel.js";

/**
 * Builds the store-owner object stored in the webapp `cloudie` cookie.
 * Keeps fields aligned across login, OTP, plans, and profile updates so fields like
 * `storeStatus` are not dropped between flows.
 *
 * @param {import('mongoose').Document} storeDoc - StoreOwner document
 * @param {object} [options]
 * @param {boolean} [options.includePassword=false] - Include password hash (legacy OTP / plan flows)
 * @param {object|null|undefined} [options.subscription] - Active subscription doc; if `undefined`, looks up Active subscription
 */
export async function buildStoreOwnerWebSessionToken(storeDoc, options = {}) {
    const { includePassword = false, subscription: subscriptionOption } = options;

    let plan = subscriptionOption;
    if (plan === undefined) {
        plan = await SubscriptionModel.findOne({
            storeID: storeDoc._id,
            status: ["Active"],
        });
    }

    const isSubscribed = !!(plan && plan.status?.includes("Active"));

    const token = {
        _id: storeDoc._id.toString(),
        username: storeDoc.storeName,
        email: storeDoc.email,
        role: storeDoc.role,
        description: storeDoc.description,
        city: storeDoc.city,
        state: storeDoc.state,
        country: storeDoc.country,
        addressLine: storeDoc.addressLine,
        postalCode: storeDoc.postalCode,
        phone: storeDoc.phone,
        status: storeDoc.status,
        verified: storeDoc.verified,
        isOtpVerified: storeDoc.isOtpVerified,
        storeStatus: storeDoc.storeStatus,
        storeLatitude: storeDoc.storeLatitude,
        storeLongitude: storeDoc.storeLongitude,
        isSubscribed,
        planID: plan ? plan.planID : "",
        planDuration: plan ? plan.duration[0] : "No Subscription",
    };

    if (includePassword) {
        token.password = storeDoc.password;
    }

    return token;
}
