import AdminModel from "../models/AdminModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import autoMailer from "../utils/AutoMailer.js";
import stripe from "../utils/StripeConfig.js";
import fs from "fs"
import ProductModel from "../models/ProductModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
import CategoryModel from "../models/CategoryModel.js";
import OrderModel from "../models/OrderModel.js";
import PlanModel from "../models/PlanModel.js";
import RiderModel from "../models/RiderModel.js";
import mongoose from "mongoose";


// @POST
// /api/store/create-store
const HandleSignupStore = async (req, res) => {
    try {
        const {
            storeName,
            email,
            password,
            description,
            city,
            state,
            country,
            addressLine,
            postalCode,
            phone,
            dob,
            ssn_last_4,
            cardID,
            tokenID,
            categories
        } = req.body;

        // console.log(JSON.stringify(dob));
        // console.log(JSON.parse(dob))

        const existingStore = await StoreOwnerModel.findOne({
            $or: [
                { email },
                { storeName }
            ]
        }) || await AdminModel.findOne({
            $or: [
                { email }
            ]
        }) || await User.findOne({
            $or: [
                { email }
            ]
        })


        const findAdmin = await AdminModel.find();
        const adminID = findAdmin[0]._id;

        const logo = req?.files?.logo;
        const w9form = req?.files?.w9form;

        const identity_back = req.files.identity_back;
        const identity_front = req.files.identity_front;

        const backFileData = fs.readFileSync(identity_back.tempFilePath);
        const frontFileData = fs.readFileSync(identity_front.tempFilePath);

        const uploadResult = logo ? await cloudinary.uploader.upload(logo.tempFilePath, {
            resource_type: 'image',
            folder: "stores-logo",
        }) : '';
        const w9formResult = w9form ? await cloudinary.uploader.upload(w9form.tempFilePath, {
            resource_type: 'image',
            folder: "stores-logo",
        }) : '';

        const back = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: backFileData,
                name: identity_back.name,
                type: 'application/octet-stream',
            },
        });

        const front = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: frontFileData,
                name: identity_front.name,
                type: 'application/octet-stream',
            },
        });

        if (existingStore && existingStore.email === email) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        if (existingStore && existingStore.storeName === storeName) {
            return res.status(400).json({ message: 'Store name already exists' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const getOtpCode = otpCode;
        const getOtpExpire = Date.now() + 600000;


        const newStore = new StoreOwnerModel({
            storeName,
            email: email.toLowerCase(),
            password,
            description,
            city,
            state,
            country,
            addressLine,
            postalCode,
            phone,
            w9form: w9formResult.secure_url,
            logo: uploadResult.secure_url,
            OtpCode: getOtpCode,
            OtpExp: getOtpExpire,
            dob,
            identity_back: back.id,
            identity_front: front.id,
            ssn_last_4,
            categories
        })

        const fomrattedDob = dob.split("-");

        const account = await stripe.accounts.create({
            country: 'US',
            type: 'custom',
            email: newStore.email,
            business_type: 'individual',
            business_profile: {
                url: newStore.logo
            },
            individual: {
                first_name: newStore.storeName,
                last_name: " ",
                email: newStore.email,
                phone: newStore.phone,
                dob: {
                    day: Number(fomrattedDob[2]),
                    month: Number(fomrattedDob[1]),
                    year: Number(fomrattedDob[0]),
                },
                address: {
                    line1: newStore.addressLine,
                    city: newStore.city,
                    state: newStore.state,
                    country: newStore.country,
                    postal_code: newStore.postalCode
                },
                ssn_last_4: newStore.ssn_last_4,
                verification: {
                    document: {
                        back: back.id,
                        front: front.id,
                    }
                }
            },

            external_account: tokenID,



            capabilities: {
                transfers: {
                    requested: true,
                },
            },

            settings: {
                payouts: {
                    debit_negative_balances: true,
                }
            }
        });

        // Accept TOS
        await stripe.accounts.update(account.id, {
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: '8.8.8.8',
            }
        });

        // Update capabilities
        await stripe.accounts.updateCapability(account.id, 'transfers', {
            requested: true,
        });

        await newStore.save();

        await StoreOwnerModel.findByIdAndUpdate(newStore._id, {
            cardID: account.external_accounts.data[0].id,
        })

        await StoreOwnerModel.findByIdAndUpdate(newStore._id, {
            accountID: account.id
        })

        autoMailer(
            {
                from: 'wasifmehmood903@gmail.com',
                to: newStore.email,
                subject: 'OTP VERIFICATION CODE',
                message: `<h3>Your OTP Verification Code Is: </h3>
                <h3> ${newStore.OtpCode}</h4>`
            }
        );


        const toValidate = {
            storeName: newStore.storeName,
            email: newStore.email,
        }

        res.status(201).json({ message: 'Store created successfully', toValidate })

    } catch (error) {
        console.log(error);
        switch (error.type) {
            case 'StripeCardError':
                return res.status(500).json({ message: `A payment error occurred: ${error.message}` });
            case 'StripeInvalidRequestError':
                return res.status(500).json({ message: error.raw.message });
            default:
                return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

// @PATCH
// /api/store/store-otp
const HandleVerifyStoreOtp = async (req, res) => {
    try {
        const { email, OtpCode } = req.body;
        const findUser = await StoreOwnerModel.findOne({ email: email })

        if (!findUser) {
            return res.status(404).json({ message: "Sorry, We couldn't send your OTP Verification Code" });
        }

        if (OtpCode === "") {
            return res.status(404).json({ message: "OTP Field Is Required" })
        }

        if (findUser.OtpCode !== Number(OtpCode)) {

            return res.status(404).json({ message: "Invalid OTP Verification Code" })
        }

        if (findUser.OtpCode === Number(OtpCode) && findUser.OtpExp && findUser.OtpExp > new Date()) {

            findUser.isOtpVerified = true || findUser.isOtpVerified
            await findUser.save();

            const token = {
                _id: findUser._id.toString(),
                username: findUser.username,
                email: findUser.email,
                password: findUser.password,
                role: findUser.role,
                description: findUser.description,
                city: findUser.city,
                state: findUser.state,
                country: findUser.country,
                phone: findUser.phone,
                addressLine: findUser.addressLine,
                postalCode: findUser.postalCode,
                status: findUser.status,
                verified: findUser.verified,
                isOtpVerified: findUser.isOtpVerified
            }
            return res.status(200).json({ message: "OTP Verified Successfully", token });

        } else {
            return res.status(404).json({ message: "OTP has expired or is invalid" });
        }
    } catch (error) {
        // console.log(error);

        res.status(500).json({ message: "Internal Server Error" })
    }
}

// @PATCH
// /api/store/update-store/:storeID
const HandleUpdateStore = async (req, res) => {
    try {

        const { storeID } = req.params;

        const {
            storeName,
            email,
            password,
            description,
            city,
            state,
            country,
            addressLine,
            postalCode,
            status
        } = req.body;

        const findStore = await StoreOwnerModel.findById(storeID);

        const logo = req?.files?.logo;
        const w9form = req?.files?.w9form;


        if (!findStore) {
            return res.status(404).json({ message: "Store Not Found" })
        }

        const uploadResult = logo ? await cloudinary.uploader.upload(logo.tempFilePath, {
            resource_type: 'image',
            folder: "stores-logo",
        }) : findStore.logo;
        const w9formResult = w9form ? await cloudinary.uploader.upload(w9form.tempFilePath, {
            resource_type: 'image',
            folder: "stores-logo",
        }) : findStore.w9form;


        const findExistingStore = await StoreOwnerModel.findOne({
            _id: { $ne: findStore._id },
            $or: [
                { email },
                { storeName }
            ]
        }) || await AdminModel.findOne({
            _id: { $ne: findStore._id },
            $or: [
                { email }
            ]
        }) || await User.findOne({
            _id: { $ne: findStore._id },
            $or: [
                { email }
            ]
        })

        if (findExistingStore) {
            return res.status(400).json({ message: "Username Or Store Name Already Exists" })
        }

        findStore.storeName = storeName || findStore.storeName
        findStore.email = email.toLowerCase() || findStore.email
        findStore.password = password || findStore.password
        findStore.description = description || findStore.description
        findStore.city = city || findStore.city
        findStore.state = state || findStore.state
        findStore.country = country || findStore.country
        findStore.addressLine = addressLine || findStore.addressLine
        findStore.postalCode = postalCode || findStore.postalCode
        findStore.status = status || findStore.status
        findStore.logo = uploadResult.secure_url || findStore.logo
        findStore.w9form = w9formResult.secure_url || findStore.w9form

        await findStore.save();

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
            phone: findStore.phone,
            postalCode: findStore.postalCode,
            status: findStore.status,
            verified: findStore.verified,
            isOtpVerified: findStore.isOtpVerified
        }

        res.status(200).json({ message: "Store Updated Successfully", token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// /api/store/get-store/:storeID
const HandleGetStoreProfile = async (req, res) => {
    try {

        const { storeID } = req.params;
        const findStore = await StoreOwnerModel.findById(storeID).select("-password");
        const findSubscription = await SubscriptionModel.findOne({ storeID: findStore._id, status: ['Active'] }).populate({
            path: 'planID',
            model: "plans",
            select: ""
        });

        if (!findStore) {
            return res.status(404).json({ message: "Invalid Request" })
        }

        const store = {
            ...findStore.toObject(),
            planName: findSubscription ? findSubscription.planID.planName : "",
            duration: findSubscription ? findSubscription.planID.duration[0] : "",
            planID: findSubscription ? findSubscription.planID._id : ""
        }

        res.status(200).json(store);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH 
// /api/store/resubmit-verification/:storeID
const HandleResubmitVerification = async (req, res) => {
    try {

        const { storeID } = req.params;
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Invalid Request" })
        }
        if (findStore.verified.includes("Accepted") || findStore.verified.includes("Pending")) {
            return res.status(400).json({ message: "Your verification is already being processed" })
        }
        const w9form = req?.files?.w9form;
        if (!w9form) {
            return res.status(400).json({ message: "Error While Uploading File" })
        }
        const w9formResult = w9form ? await cloudinary.uploader.upload(w9form.tempFilePath, {
            resource_type: 'image',
            folder: "stores-logo",
        }) : '';

        findStore.w9form = w9formResult.secure_url;
        findStore.verified = ["Pending"]

        await findStore.save();


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
            phone: findStore.phone,
            addressLine: findStore.addressLine,
            postalCode: findStore.postalCode,
            status: findStore.status,
            verified: findStore.verified,
            isOtpVerified: findStore.isOtpVerified
        }

        res.status(200).json({ message: "Verification Re-Submitted Successfully", token })


    } catch (error) {
        console.log(error);
    }
}


const HandleDeleteAccount = async (req, res) => {
    try {

        const { accID } = req.params;
        // const findStore = await StoreOwnerModel.findById(storeID);
        // if (!findStore) {
        //     return res.status(404).json({ message: "Store Not Found" })
        // }
        // const deleteAccFromStripe = await stripe.accounts.del(findStore.accountID);
        // if (deleteAccFromStripe.deleted !== true) {
        //     return res.status(400).json({
        //         message: "Error Occured While Deleting Account",
        //     })
        // }
        // const findProducts = await ProductModel.deleteMany({ storeID: storeID });
        // const findSubscriptions = await SubscriptionModel.deleteMany({
        //     storeID: storeID
        // });

        const deleteAccFromStripe = await stripe.accounts.del(accID);
        if (deleteAccFromStripe.deleted !== true) {
            return res.status(400).json({
                message: "Error Occured While Deleting Account",
            })
        }
        res.status(200).json({ message: "Account Deleted Successfully" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleGetStoreDashboard = async (req, res) => {
    try {

        //     const { StoreId } = req.params;
        //     const storeObjectId = new mongoose.Types.ObjectId(StoreId);
        //     const findStores = await StoreOwnerModel.findById(storeObjectId);
        //     if (!findStores) {
        //         return res.status(404).json({ message: "Admin Not Found" });
        //     }

        //     const totalRiders = await RiderModel.countDocuments();
        //     const listedCategories = await CategoryModel.countDocuments();
        //     const totalProducts = await ProductModel.countDocuments();
        //     const totalOrders = await OrderModel.countDocuments();
        //     const planName = await SubscriptionModel.countDocuments()
        //  const orderPrice = await OrderModel.find();
        //     const price = orderPrice.map(item => item.totalAmount).reduce((accumulator, currentValue) => {
        //         return accumulator + currentValue;
        //     }, 0);
        //     // const plans = planName.planName
        //     return res.status(200).json({ totalOrders, totalProducts, listedCategories, planName, price, totalRiders })

        //     // } else {
        //     //     res.status(500).json({ message: "Internal Server Error" })
        //     // }

        // } catch (error) {
        //     console.log(error);
        //     res.status(500).json({ message: "Internal Server Error" })
        // }

        const { id } = req.params;
        // try {
        const findStore = await StoreOwnerModel.findById(id) || await AdminModel.findById(id);

        if (!findStore) {
            return res.status(404).json({ message: 'Store not found' });
        }

        if (findStore.role.includes("StoreOwner")) {
            const orders = await OrderModel.find({
                isConfirmed: false, $or: [
                    { 'items.storeID': id },
                ],
            })

            let totalRevenue = 0;

            for (const order of orders) {
                await Promise.all(order.checkout.map(async (item) => {
                    const findStore = await StoreOwnerModel.findById(item.storeID);
                    const product = await ProductModel.findOne({ _id: item.prodID, storeID: id });

                    if (product && typeof product.price === 'number' && !isNaN(product.price) && typeof item.qty === 'number' && !isNaN(item.qty)) {
                        totalRevenue += product.price * item.qty;
                    } else {
                        console.error("Invalid values in checkout", product ? product.price : 'No product', item.qty);
                    }
                }));

                await Promise.all(order.quotation.map(async (item) => {
                    const findStore = await StoreOwner.findById(item.storeID);
                    const product = await ProductModel.findOne({ _id: item.prodID, storeID: id });
                    console.log(product, "product");

                    if (product && typeof item.totalAmount === 'number' && !isNaN(item.totalAmount)) {
                        totalRevenue += item.totalAmount;
                    } else {
                        console.error("Invalid price in quotation", item.totalAmount);
                    }
                }));
            }

            console.log(totalRevenue, "totl revence");
            

            const product = await ProductModel.countDocuments({ storeID: id })

            return res.status(200).json({ totalRevenue, product, totalOrders: orders.length });
        } else {
            res.status(500).json({ message: 'Internal Server Error' });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

export {
    HandleSignupStore,
    HandleVerifyStoreOtp,
    HandleUpdateStore,
    HandleGetStoreProfile,
    HandleResubmitVerification,
    HandleDeleteAccount,
    HandleGetStoreDashboard
}