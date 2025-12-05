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
import AdminModel from "../models/AdminModel.js";


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
        let { page = 1, limit = 5, keyword = "" } = req.query;

        page = Number(page);
        limit = Number(limit);
        const skip = (page - 1) * limit;

        const findUser = await AdminSchema.findById(id);
        if (!findUser) {
            return res.status(404).json({ message: "User Not Found" });
        }

        const isAdmin =
            findUser.role === "Admin" ||
            (Array.isArray(findUser.role) && findUser.role.includes("Admin"));

        if (!isAdmin) {
            return res.status(401).json({ message: "Unauthorized Request" });
        }

        const filter = keyword
            ? {
                  $or: [
                      { storeName: { $regex: keyword, $options: "i" } },
                      { email: { $regex: keyword, $options: "i" } },
                      { phone: { $regex: keyword, $options: "i" } },
                  ],
              }
            : {};

        const stores = await StoreOwnerModel.find(filter)
            .skip(skip)
            .limit(limit);

        const totalStores = await StoreOwnerModel.countDocuments(filter);
        const totalStorePages = Math.ceil(totalStores / limit);

        const pendingStores = await StoreOwnerModel.find({
            ...filter,
            verified: "Pending",
        })
            .skip(skip)
            .limit(limit);

        const pendingCount = await StoreOwnerModel.countDocuments({
            ...filter,
            verified: "Pending",
        });
        const pendingPages = Math.ceil(pendingCount / limit);

        if (stores.length === 0) {
            return res.status(404).json({ message: "No Stores Found" });
        }

        return res.status(200).json({
            allStores: {
                data: stores,
                totalPages: totalStorePages,
                totalCount: totalStores,
                currentPage: page,
                limit,
            },
            pendingStores: {
                data: pendingStores,
                totalPages: pendingPages,
                totalCount: pendingCount,
                currentPage: page,
                limit,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


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

const HandleGetChartData = async (req, res) => {
    const { adminId } = req.params;
    const { month, year } = req.query;

    try {
        const findStore = await StoreOwnerModel.findById(adminId) || await AdminModel.findById(adminId);
        if (!findStore) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

        const currentYear = new Date().getFullYear();
        const selectedYear = year ? parseInt(year) : currentYear;

        const fetchOrders = async (start, end) => {
            return await OrderModel.find({
                createdAt: { $gte: start, $lt: end }
            });
        };

        let data = [];

        if (month) {
            const monthIndex = isNaN(month) ? monthNames.indexOf(month.toLowerCase()) : parseInt(month, 10) - 1;
            const startDate = new Date(selectedYear, monthIndex, 1);
            const endDate = new Date(selectedYear, monthIndex + 1, 1);

            const orders = await fetchOrders(startDate, endDate);

            const storeOrders = orders
                .map(order => {
                    if (!order.items || !Array.isArray(order.items)) return null;
                    const storeItems = order.items.filter(item => item.storeID && item.storeID.toString() === adminId);
                    if (storeItems.length > 0) {
                        const storeTotalAmount = storeItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
                        return { ...order.toObject(), items: storeItems, totalAmount: storeTotalAmount };
                    }
                    return null;
                })
                .filter(order => order !== null);

            const totalSales = storeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
            const clients = [...new Map(storeOrders.map(o => [o.userId.toString(), o])).values()];

            data.push({
                name: monthOrder[monthIndex],
                Sales: totalSales,
                Orders: storeOrders.length,
                Clients: clients.length
            });
        } else {
            for (let m = 0; m < 12; m++) {
                const startDate = new Date(selectedYear, m, 1);
                const endDate = new Date(selectedYear, m + 1, 1);

                const orders = await fetchOrders(startDate, endDate);

                const storeOrders = orders
                    .map(order => {
                        if (!order.items || !Array.isArray(order.items)) return null;
                        const storeItems = order.items.filter(item => item.storeID && item.storeID.toString() === adminId);
                        if (storeItems.length > 0) {
                            const storeTotalAmount = storeItems.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0);
                            return { ...order.toObject(), items: storeItems, totalAmount: storeTotalAmount };
                        }
                        return null;
                    })
                    .filter(order => order !== null);

                const totalSales = storeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
                const clients = [...new Map(storeOrders.map(o => [o.userId.toString(), o])).values()];

                data.push({
                    name: monthOrder[m],
                    Sales: totalSales,
                    Orders: storeOrders.length,
                    Clients: clients.length
                });
            }
        }

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const HandleGetAllSubscriptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, keyword = "" } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        let filter = {};
        if (keyword) {
            filter = {
                $or: [
                    { "store.storeName": { $regex: keyword, $options: "i" } },
                    { "plan.title": { $regex: keyword, $options: "i" } },
                ],
            };
        }

        let subscriptions = await SubscriptionModel.aggregate([
            {
                $lookup: {
                    from: "storeownermodels",
                    localField: "storeID",
                    foreignField: "_id",
                    as: "store",
                },
            },
            { $unwind: "$store" },
            {
                $lookup: {
                    from: "plans",
                    localField: "planID",
                    foreignField: "_id",
                    as: "plan",
                },
            },
            { $unwind: "$plan" },
            ...(keyword ? [{ $match: filter }] : []),
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
        ]);

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(404).json({ message: "No subscriptions found" });
        }

        subscriptions = subscriptions.map((sub) => {
            const start = new Date(sub.createdAt);
            const end = new Date(start);

            const duration = Array.isArray(sub.duration) ? sub.duration[0] : sub.duration;

            switch (duration) {
                case "Trial":
                    end.setDate(end.getDate() + 7);
                    break;
                case "Monthly":
                    end.setMonth(end.getMonth() + 1);
                    break;
                case "Quarterly":
                    end.setMonth(end.getMonth() + 3);
                    break;
                case "Yearly":
                    end.setFullYear(end.getFullYear() + 1);
                    break;
            }

            const now = new Date();
            const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

            return {
                ...sub,
                startDate: start,
                endDate: end,
                remainingDays: diff >= 0 ? diff : 0,
            };
        });

        let totalSubscriptions = await SubscriptionModel.aggregate([
            {
                $lookup: {
                    from: "storeownermodels",
                    localField: "storeID",
                    foreignField: "_id",
                    as: "store",
                },
            },
            { $unwind: "$store" },
            {
                $lookup: {
                    from: "plans",
                    localField: "planID",
                    foreignField: "_id",
                    as: "plan",
                },
            },
            { $unwind: "$plan" },
            ...(keyword ? [{ $match: filter }] : []),
            { $count: "total" },
        ]);

        const totalCount = totalSubscriptions[0]?.total || 0;

        res.status(200).json({
            message: "Subscriptions retrieved successfully",
            subscriptions,
            currentPage: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)),
            totalSubscriptions: totalCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export { HandleGetAllUsers, HandleCreateAdmin, HandleUpdateAdmin, HandleGetAdmin, HandleVerfiyStore, HandleGetAllStores, HandleGetAdminDashboard, HandleGetChartData, HandleGetAllSubscriptions };