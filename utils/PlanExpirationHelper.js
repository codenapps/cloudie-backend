import PlanModel from "../models/PlanModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";

const PlanExpirationHelper = async () => {
    try {
        const subscriptions = await SubscriptionModel.find();
        const currentDate = new Date();

        for (const subscription of subscriptions) {
            const plan = await PlanModel.findById(subscription.planID);
            let expirationDate;

            const trialDays = plan?.trialDays;

            if (subscription.duration.includes("Yearly")) {
                expirationDate = new Date(subscription.createdAt);
                expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            } else if (subscription.duration.includes("Quarterly")) {
                expirationDate = new Date(subscription.createdAt);
                expirationDate.setMonth(expirationDate.getMonth() + 3);
            } else if (subscription.duration.includes("Monthly")) {
                expirationDate = new Date(subscription.createdAt);
                expirationDate.setMonth(expirationDate.getMonth() + 1);
            } else if (subscription.duration.includes("Trial")) {
                expirationDate = new Date(subscription.createdAt);
                expirationDate.setDate(expirationDate.getDate() + trialDays);
            }

            if (currentDate >= expirationDate) {
                await SubscriptionModel.updateOne(
                    { _id: subscription._id },
                    { status: "Expired" }
                );
            } else {
                console.log("No Expiration Date");
            }
        }
    } catch (error) {
        throw error;
    }
};

export default PlanExpirationHelper;