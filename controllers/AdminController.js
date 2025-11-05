import AdminSchema from "../models/AdminModel.js"
import ChatModel from "../models/ChatModel.js";
import ConnectionModel from "../models/ConnectionModel.js";
import PlanModel from "../models/PlanModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import SubscriptionModel from "../models/SubscriptionModel.js";
import User from "../models/User.js";
import OrderModel from "../models/OrderModel.js";
import ProductModel from "../models/ProductModel.js";
import RiderModel from "../models/RiderModel.js";
import CategoryModel from "../models/CategoryModel.js";


const HandleGetAllUsers = (req, res) => {
    try {
        res.send("MVC WORKING, Welcome");
    } catch (error) {
        console.log(error);
    }
}



// @POST 
// ENDPOINT: /api/admin/create-admin
const HandleCreateAdmin = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const findAdmin = await AdminSchema.find();
        if (findAdmin.length !== 0) {
            return res.status(400).json({ messsage: "Invalid Signup Request" })
        }
        const newAdmin = new AdminSchema({
            username,
            email,
            password,
            role
        });
        await newAdmin.save();
        const token = {
            username: newAdmin.username,
            email: newAdmin.email,
            password: newAdmin.password,
            role: newAdmin.role,
        }
        res.status(201).json({ message: "Admin Signed Up Successfully", token: token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH
// ENDPOINT: /api/admin/update-admin/:id
const HandleUpdateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password } = req.body;
        const findAdmin = await AdminSchema.findById(id);
        if (!findAdmin) {
            return res.status(404).json({ message: "Admin Not Found" });
        }
        findAdmin.username = username || findAdmin.username
        findAdmin.email = email || findAdmin.email
        findAdmin.password = password || findAdmin.password
        await findAdmin.save();
        const token = {
            username: findAdmin.username,
            email: findAdmin.email,
            password: findAdmin.password,
            role: findAdmin.role,
        }
        res.status(200).json({ message: "Admin Updated Successfully", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// ENDPOINT: /api/admin/get-admin
const HandleGetAdmin = async (req, res) => {
    try {
        const findAdmin = await AdminSchema.find();
        if (findAdmin.length === 0) {
            return res.status(404).json({ message: "Admin Doesn't Exist" });
        }
        const findStore = await StoreOwnerModel.find({ verified: 'Accepted' });

        const map = await Promise.all(findStore.map(async (item) => {
            const findConnections = await ConnectionModel.find({
                $or: [
                    { userOne: item._id, userTwo: findAdmin[0]._id },
                    { userOne: findAdmin[0]._id, userTwo: item._id }
                ]
            });

            const lastMessages = await Promise.all(findConnections.map(async (connection) => {
                const findChats = await ChatModel.find({

                    $or: [
                        { senderID: item._id, recieverID: findAdmin[0]._id },
                        { senderID: findAdmin[0]._id, recieverID: item._id }
                    ]
                }).sort({ createdAt: -1 }).limit(1);
                return findChats.length ? findChats[0] : "Start Conversation";
            }));

            return {
                item,
                lastMessages: lastMessages.filter(Boolean)
            };
        }));

        res.status(200).json({ admin: findAdmin[0], conversations: map });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH
// /api/admin/approve-store/storeID 
const HandleVerfiyStore = async (req, res) => {
    try {

        const { storeID } = req.params;
        const { verified } = req.body;
        const findStore = await StoreOwnerModel.findById(storeID);
        if (!findStore) {
            return res.status(404).json({ message: "Invalid Request" })
        }

        if (findStore.verified.includes("Pending")) {
            if (verified.includes("Accepted")) {
                findStore.verified = verified || findStore.verified
                await findStore.save();
                const findSub = await PlanModel.findOne({ duration: ["Trial"] });
                if (!findSub) {
                    return res.status(400).json({ message: "Trial Error" })
                }
                const createTrialSub = await SubscriptionModel.findOne({
                    storeID: findStore._id,
                    duration: ["Trial"]
                })
                if (!createTrialSub) {
                    const createTrial = new SubscriptionModel({
                        storeID: findStore._id,
                        planID: findSub._id,
                        accountID: findStore.accountID,
                        duration: findSub.duration,
                    })
                    await createTrial.save();
                    return res.status(200).json({ message: "Store KYC Accepted" })
                } else {
                    return res.status(200).json({ message: "This store already have an active subscription" })
                }

            } else {
                findStore.verified = verified || findStore.verified
                await findStore.save();
                return res.status(200).json({ message: "Store KYC Rejected" })
            }
        } else {
            return res.status(400).json({ message: "Invalid Status Update Request" })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// /api/admin/get-all-stores/:id 
const HandleGetAllStores = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 5 } = req.query;

        const findUser = await User.findById(id) || await StoreOwnerModel.findById(id) || await AdminSchema.findById(id);

        if (!findUser) {
            return res.status(404).json({ message: "User Not Found" });
        }

        if (findUser.role.includes('Admin')) {

            // const findStores = await StoreOwnerModel.find().limit(limit * 1)
            //     .skip((page - 1) * limit)
            //     .exec();
            // const totalPages = await StoreOwnerModel.countDocuments();
            // if (findStores.length === 0) {
            //     return res.status(404).json({ message: "No Stores Found" });
            // }


            const findStores = await StoreOwnerModel.find({ verified: "Pending" }).limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();
            const totalPages = await StoreOwnerModel.countDocuments({ verified: "Pending" });
            if (findStores.length === 0) {
                return res.status(404).json({ message: "No Stores Found" });
            }
            res.status(200).json({
                stores: findStores, totalPages: Math.ceil(totalPages / limit),
                currentPage: Number(page),
            });


        } else if (findUser.role.includes('StoreOwner')) {

            return res.status(401).json({ stores: "Unauthorized Request" });

        } else {
            res.status(401).json({ stores: "Invalid Request" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleGetAdminDashboard = async (req, res) => {
    try {

        const { id } = req.params;
        const findAdmin = await AdminSchema.findById(id);
        if (!findAdmin) {
            return res.status(404).json({ message: "Admin Not Found" });
        }
        if (findAdmin.role.includes("Admin")) {
            const totalUsers = await User.countDocuments();
            const findStores = await StoreOwnerModel.countDocuments();
            const totalRiders = await RiderModel.countDocuments();
            const listedCategories = await CategoryModel.countDocuments();
            // const findPendingStores = await StoreOwnerModel.countDocuments({ verified: "Pending" });
            const totalProducts = await ProductModel.countDocuments();
            const totalOrders = await OrderModel.countDocuments();
            const findTotalQueries = await ChatModel.countDocuments({ messageType: "text" });
            const SubscriptionModelss = await SubscriptionModel.countDocuments();
            const planPrice = await PlanModel.find()
            const price = planPrice.map(item => item.price).reduce((accumulator, currentValue) => {
                return accumulator + currentValue;
            }, 0);

            return res.status(200).json({ totalStores: findStores, totalUsers, totalOrders, clientQueries: findTotalQueries, totalEarnings: price, SubscriptionModelss: SubscriptionModelss, products: totalProducts, totalRiders: totalRiders, listedCategories: listedCategories })
        } else {
            res.status(500).json({ message: "Internal Server Error" })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}


export { HandleGetAllUsers, HandleCreateAdmin, HandleUpdateAdmin, HandleGetAdmin, HandleVerfiyStore, HandleGetAllStores, HandleGetAdminDashboard };