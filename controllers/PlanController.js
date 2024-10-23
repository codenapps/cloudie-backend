import AdminModel from "../models/AdminModel.js";
import PlanModel from "../models/PlanModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
import User from "../models/User.js";
import stripe from "../utils/StripeConfig.js";



// @POST
// /api/plan/:adminID/create-plan

const HandleCreatePlan = async (req, res) => {
    try {
        const { adminID } = req.params;
        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) return res.status(404).json({ message: 'Admin not found' });
        const { planName, description, price, discountedPrice, duration, trialDays } = req.body;

        const findPlan = await PlanModel.findOne({ planName: planName });
        if (findPlan) return res.status(400).json({ message: "Plan Name Should be Unqiue" })

        const validateDefaultPlan = await PlanModel.findOne({ duration: ["Trial"] });

        if (validateDefaultPlan && duration.includes("Trial")) {
            return res.status(400).json({ message: "Default Plan Can Only Be Created Once" })
        }

        const newPlan = new PlanModel({
            admin: adminID,
            planName,
            description,
            price,
            discountedPrice,
            duration,
            trialDays
        });
        await newPlan.save();
        res.status(201).json({ message: 'Plan Created successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @GET 
// /api/plan/get-plans?id={cookieId} (ID IS OPTIONAL)
const HandleGetPlans = async (req, res) => {
    try {
        const { id } = req.query;
        const findUser = await User.findById(id) || await AdminModel.findById(id) || await StoreOwnerModel.findById(id);
        if (findUser) {

            if (findUser.role.includes("Admin")) {
                const plan = await PlanModel.find();
                return res.status(200).json({ plan })
            } else if (findUser.role.includes("StoreOwner")) {
                const plan = await PlanModel.find();
                return res.status(200).json({ plan })
            } else {
                const plan = await PlanModel.find();
                return res.status(200).json({ plan })
            }

        } else {
            const plan = await PlanModel.find();
            res.status(200).json({ plan })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

// @PATCH
// /api/plan/:adminID/update-plan/:planID
const HandleUpdatePlan = async (req, res) => {
    try {
        const { planID, adminID } = req.params;
        const {
            planName,
            description,
            duration,
            price,
            discountedPrice,
            trialDays } = req.body;

        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) return res.status(404).json({ message: 'Admin not found' });

        const findPlan = await PlanModel.findById(planID);
        if (!findPlan) return res.status(404).json({ message: 'Plan not found' });

        findPlan.planName = planName || findPlan.planName;
        findPlan.description = description || findPlan.description;
        findPlan.price = price || findPlan.price
        findPlan.discountedPrice = discountedPrice || findPlan.discountedPrice
        findPlan.trialDays = trialDays || findPlan.trialDays
        findPlan.duration = duration || findPlan.duration;

        await findPlan.save();
        res.status(200).json({ message: 'Plan updated successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @DELETE
// /api/plan/:adminID/delete-plan/:planID
const HandleDeletePlan = async (req, res) => {
    try {
        const { planID, adminID } = req.params;
        const findAdmin = await AdminModel.findById(adminID);
        if (!findAdmin) return res.status(404).json({ message: 'Admin not found' });
        const findPlan = await PlanModel.findById(planID);
        if (!findPlan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        await PlanModel.findByIdAndDelete(planID);
        res.status(200).json({ message: 'Plan deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @GET 
// /api/plan/storeID/get-single-plans/planID
const HandleGetSinglePlan = async (req, res) => {
    try {
        const { planID, storeID } = req.params;

        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" });
        }

        const plan = await PlanModel.findById(planID);
        if (!plan) {
            return res.status(404).json({
                message: "Plan not found"
            });
        }

        const retrieveCard = await stripe.accounts.retrieveExternalAccount(findStore.accountID, findStore.cardID);

        const data = {
            planName: plan.planName,
            price: plan.price,
            discountedPrice: plan.discountedPrice,
            duration: plan.duration,
            expiresOn: '',
            purchasedOn: '',
            description: plan.description,
            trialDays: plan.trialDays,
            card: {
                brand: retrieveCard.brand,
                country: retrieveCard.country,
                number: retrieveCard.last4,
                cvc: retrieveCard.cvc_check,
                expiry: retrieveCard.exp_month + "/" + retrieveCard.exp_year,
            }
        };

        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };

        const currentDate = new Date();
        data.purchasedOn = currentDate.toLocaleDateString(undefined, options);

        const expirationDate = new Date(currentDate);

        if (plan.duration.includes("Monthly")) {
            expirationDate.setMonth(currentDate.getMonth() + 1);

        } else if (plan.duration.includes("Quarterly")) {
            expirationDate.setFullYear(currentDate.getMonth() + 6);

        } else if (plan.duration.includes("Yearly")) {
            expirationDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (plan.duration.includes("Trial")) {
            expirationDate.setFullYear(currentDate.getDay() + plan.trialDays);
        }

        data.expiresOn = expirationDate.toLocaleDateString(undefined, options);

        res.status(200).json({ plan: data });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}

// @PATCH
// /api/plan/storeID/update-card
const HandleUpdateCard = async (req, res) => {
    try {
        const { storeID } = req.params;
        const { tokenID } = req.body;
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" })
        }
        if (!findStore.verified.includes("Accepted")) {
            return res.status(400).json({ message: "Your Store Details Are Not Verified" })
        }
        const account = await stripe.accounts.retrieve(findStore.accountID);

        const extractCardID = account.external_accounts.data?.[0].id;
        const externalAccount = await stripe.accounts.createExternalAccount(
            findStore.accountID,
            {
                external_account: tokenID,
            }
        );
        findStore.cardID = externalAccount.id;
        await findStore.save();

        res.status(200).json({ message: "Card Updated Successfully" })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


// @POST
// /api/plan/:storeID/purchase-plan/:planID
const HandlePurchasePlan = async (req, res) => {
    try {
        const { planID, storeID } = req.params;
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Store not found" })
        }

        const findPlan = await PlanModel.findById(planID);
        if (!findPlan) {
            return res.status(404).json({ message: "Plan not found" })
        }

        const getMainStripeAcc = await stripe.accounts.retrieve();

        const transfer = await stripe.transfers.create({
            amount: findPlan.discountedPrice !== null ? findPlan.discountedPrice * 100 : findPlan.price * 100,
            currency: 'usd',
            destination: getMainStripeAcc.id,
        }, {
            stripeAccount: findStore.accountID,
        });

        const validateSub = await SubscriptionModel.findOne({ storeID: findStore._id, status: ["Active"], duration: { $ne: ["Trial"] } });
        if (validateSub) {
            return res.status(400).json({ message: "You already have an active subscription" })
        }

        const findTrialSub = await SubscriptionModel.findOne({ storeID: findStore._id, duration: ["Trial"] });

        const findOtherSub = await SubscriptionModel.findOne({ storeID: findStore._id, duration: { $ne: ["Trial"] }, status: ["Active"] });

        if (findTrialSub) {
            findTrialSub.status = ["Expired"]
            await findTrialSub.save();
            const generateSubscription = new SubscriptionModel({
                storeID: findStore._id,
                planID: findPlan._id,
                transferID: transfer.id,
                accountID: findStore.accountID,
                duration: findPlan.duration,
            })
            await generateSubscription.save();
            const token = {
                _id: findStore._id.toString(),
                username: findStore.username,
                email: findStore.email,
                password: findStore.password,
                role: findStore.role,
                description: findStore.description,
                city: findStore.city,
                state: findStore.state,
                country: findStore.country,
                addressLine: findStore.addressLine,
                postalCode: findStore.postalCode,
                status: findStore.status,
                verified: findStore.verified,
                isOtpVerified: findStore.isOtpVerified,
                isSubscribed: generateSubscription ? true : false,
                planDuration: generateSubscription ? generateSubscription.duration[0] : "No Subscription"
            }
            return res.status(200).json({ message: "Subsription Purchased Successfully", token })
        } else if (findOtherSub) {
            return res.status(200).json({ message: "You already have an active subscription, please wait for this to expire to purchase a different one or contact your administrator" })
        }


    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @PATCH
// /api/plan/:id/action-plan/:storeID
const HandleSubscriptionAction = async (req, res) => {
    try {

        const { id, storeID } = req.params;

        const findUser = await StoreOwnerModel.findById(id) || await AdminModel.findById(id);

        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) return res.status(404).json({ message: 'Store not found' });

        if (!findUser) return res.status(404).json({ message: 'User not found' });

        if (findUser.role.includes('Admin')) {

            const findSubscription = await SubscriptionModel.findOne({ status: ['Active'], storeID: findStore._id })
            if (!findSubscription) return res.status(404).json({ message: 'No active subscription found for this store' });
            findSubscription.status = ["Suspended"]
            await findSubscription.save();
            return res.status(200).json({ message: 'Subscription suspended successfully' });

        } else if (findUser.role.includes('StoreOwner')) {

            const findSubscription = await SubscriptionModel.findOne({ status: ['Active'], storeID: findStore._id })
            if (!findSubscription) return res.status(404).json({ message: 'No active subscription found for this store' });
            findSubscription.status = ["Cancelled"]
            await findSubscription.save();
            console.log(findSubscription)
            const token = {
                _id: findStore._id.toString(),
                username: findStore.username,
                email: findStore.email,
                password: findStore.password,
                role: findStore.role,
                description: findStore.description,
                city: findStore.city,
                state: findStore.state,
                country: findStore.country,
                addressLine: findStore.addressLine,
                postalCode: findStore.postalCode,
                status: findStore.status,
                verified: findStore.verified,
                isOtpVerified: findStore.isOtpVerified,
                isSubscribed: findSubscription.status.includes('Active') ? true : false,
                planID: findSubscription ? findSubscription.planID : "",
                planDuration: findSubscription ? findSubscription.duration[0] : "No Subscription"
            }

            return res.status(200).json({ message: 'Subscription cancelled successfully', token });

        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export {
    HandleCreatePlan,
    HandleGetPlans,
    HandleUpdatePlan,
    HandleDeletePlan,
    HandleGetSinglePlan,
    HandleUpdateCard,
    HandlePurchasePlan,
    HandleSubscriptionAction
}