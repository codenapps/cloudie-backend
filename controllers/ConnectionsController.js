import AdminModel from "../models/AdminModel.js";
import ChatModel from "../models/ChatModel.js";
import ConnectionModel from "../models/ConnectionModel.js";
import RiderModel from "../models/RiderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";


// @POST 
// /api/connections/userOne/get-connection?chatFilter=Riders
const HandleCreateConnection = async (req, res) => {
    try {

        const { userOne, userTwo } = req.params;
        const findUserOne = await User.findById(userOne) || await StoreOwnerModel.findById(userOne) || await AdminModel.findById(userOne) || await RiderModel.findById(userOne);

        if (!findUserOne) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const findUserTwo = await User.findById(userTwo) || await StoreOwnerModel.findById(userTwo) || await AdminModel.findById(userTwo) || await RiderModel.findById(userTwo);

        if (!findUserTwo) {
            return res.status(404).json({ message: "User Not Found" })
        }

        // const validateConnection = await ConnectionModel.findOne({ $or: [{ userOne: userOne, userTwo: userTwo }, { userOne: userTwo, userTwo: userOne }] })

        // if (validateConnection) {
        //     const validateConnection = await ConnectionModel.findOne({ $or: [{ userOne: userOne, userTwo: userTwo }, { userOne: userTwo, userTwo: userOne }] })
        //     return res.status(200).json(validateConnection);
        // } else {
        //     if ((findUserOne.role.includes("Admin") && findUserTwo.role.includes("StoreOwner")) || (findUserOne.role.includes("StoreOwner") && findUserTwo.role.includes("Admin"))) {

        //         const newConnection = new ConnectionModel({
        //             userOne: userOne,
        //             userTwo: userTwo,
        //             status: ["Active"],
        //         });
        //         await newConnection.save();
        //         return res.status(200).json(newConnection);
        //     }
        // }

        const existing = await ConnectionModel.findOne({
            $or: [
                { userOne, userTwo },
                { userOne: userTwo, userTwo: userOne }
            ]
        });

        if (existing) {
            return res.status(200).json(existing);
        }

        const newConnection = new ConnectionModel({
            userOne,
            userTwo,
            status: ["Active"]
        });

        await newConnection.save();

        return res.status(200).json(newConnection);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// const HandleCreateConnection = async (req, res) => {
//     try {
//         const { userOne, userTwo } = req.params;

//         const findUserOne =
//             await User.findById(userOne) ||
//             await StoreOwnerModel.findById(userOne) ||
//             await AdminModel.findById(userOne) ||
//             await RiderModel.findById(userOne);

//         if (!findUserOne) {
//             return res.status(404).json({ message: "User One Not Found" });
//         }

//         const findUserTwo =
//             await User.findById(userTwo) ||
//             await StoreOwnerModel.findById(userTwo) ||
//             await AdminModel.findById(userTwo) ||
//             await RiderModel.findById(userTwo);

//         if (!findUserTwo) {
//             return res.status(404).json({ message: "User Two Not Found" });
//         }

//         const existing = await ConnectionModel.findOne({
//             $or: [
//                 { userOne, userTwo },
//                 { userOne: userTwo, userTwo: userOne }
//             ]
//         });

//         if (existing) {
//             return res.status(200).json(existing);
//         }

//         const canConnect =
//             (findUserOne.role.includes("Admin") && findUserTwo.role.includes("StoreOwner")) ||
//             (findUserOne.role.includes("StoreOwner") && findUserTwo.role.includes("Admin")) ||

//             (findUserOne.role.includes("StoreOwner") && findUserTwo.role.includes("Rider")) ||
//             (findUserOne.role.includes("Rider") && findUserTwo.role.includes("StoreOwner"));

//         if (!canConnect) {
//             return res.status(403).json({
//                 message: "Connection not allowed between these roles"
//             });
//         }

//         const newConnection = new ConnectionModel({
//             userOne,
//             userTwo,
//             status: ["Active"],
//         });

//         await newConnection.save();
//         return res.status(200).json(newConnection);

//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// };


// @GET
// /api/connections/userOne/get-connection?chatFilter=Riders 
const HandleGetConnections = async (req, res) => {
    try {
        const { userOne } = req.params;
        const { chatFilter } = req.query;

        const findUserOne = await User.findById(userOne) || await StoreOwnerModel.findById(userOne) || await AdminModel.findById(userOne) || await RiderModel.findById(userOne);

        if (!findUserOne) {
            return res.status(404).json({ message: "User Not Found" })
        }

        const findConnections = await ConnectionModel.find({ $or: [{ userOne: userOne }, { userTwo: userOne }] }).populate({
            path: "userOne",
            model: "user",
            select: "-password"
        }).populate({
            path: "userOne",
            model: "admin",
            select: "-password"
        }).populate({
            path: "userOne",
            model: "Riders",
            select: "-password"
        }).populate({
            path: "userOne",
            model: "StoreOwner",
            select: "-password"
        });

        if (findUserOne.role.includes("Admin")) {
            if (chatFilter === "Stores") {

                const findStore = await StoreOwnerModel.find();
                const mapLastMessage = findStore.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)
                return res.status(200).json({ chatList: resolved })

            } else if (chatFilter === "Riders") {

                const findStore = await RiderModel.find({ status: ['Active'] });

                const mapLastMessage = findStore.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)

                return res.status(200).json({ chatList: resolved })

            } else if (chatFilter === "All") {

                const findStore = await StoreOwnerModel.find();

                const findRiders = await RiderModel.find({ status: ['Active'] });

                const concated = [...findStore, ...findRiders]

                const mapLastMessage = concated.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)

                return res.status(200).json({ chatList: resolved })

            } else {
                res.status(400).json({ message: "Invalid Chat Filter" })
            }

        } else if (findUserOne.role.includes("StoreOwner")) {
            if (chatFilter === "Admin") {

                const findAdmin = await AdminModel.find();
                const mapLastMessage = findAdmin.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)
                return res.status(200).json({ chatList: resolved })

            } else if (chatFilter === "Riders") {

                const findStore = await RiderModel.find({ status: ['Active'] });
                const mapLastMessage = findStore.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)
                return res.status(200).json({ chatList: resolved })

            } else if (chatFilter === "All") {

                const findAdmin = await AdminModel.find();

                const findRiders = await RiderModel.find({ status: ['Active'] });

                const concated = [...findAdmin, ...findRiders]
                const mapLastMessage = concated.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)
                return res.status(200).json({ chatList: resolved })

            } else if (chatFilter === "Users") {

                const mapFilter = findConnections.filter((item) => item.userOne.role[0])
                const mapLastMessage = mapFilter.map(async (item) => {
                    const findLastMessage = await ChatModel.findOne({ $or: [{ senderID: userOne, recieverID: item._id }, { senderID: item._id, recieverID: userOne }] }).sort({ createdAt: -1 }).limit(1)

                    return {
                        ...item.toObject(),
                        lastMessage: findLastMessage ? findLastMessage : "Start Conversation"
                    }
                })
                const resolved = await Promise.all(mapLastMessage)
                res.status(200).json({ chatList: resolved })

            } else {
                res.status(400).json({ message: "Invalid Chat Filter" })
            }
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// @POST 
///api/connections/:senderID/send-messages/:recieverID/:connectionID
const HandleChat = async (req, res) => {
    try {

        const { senderID, recieverID, connectionID } = req.params;
        const { message } = req.body;

        const findSender = await User.findById(senderID) || await StoreOwnerModel.findById(senderID) || await AdminModel.findById(senderID) || await RiderModel.findById(senderID);

        if (!findSender) {
            return res.status(404).json({ message: "User Not Found 1" })
        }

        const findReciever = await User.findById(recieverID) || await StoreOwnerModel.findById(recieverID) || await AdminModel.findById(recieverID) || await RiderModel.findById(recieverID);

        if (!findReciever) {
            return res.status(404).json({ message: "User Not Found 2" })
        }

        const validateConnection = await ConnectionModel.findById(connectionID);

        if (!validateConnection) {
            return res.status(404).json({ message: "Connection Not Found" })
        }

        if ((validateConnection.userOne.toString() !== senderID || validateConnection.userTwo.toString() !== recieverID) && (validateConnection.userOne.toString() !== recieverID || validateConnection.userTwo.toString() !== senderID)) {
            return res.status(400).json({ message: "Invalid Request" })
        }

        const sendMessage = new ChatModel({
            senderID: senderID,
            recieverID: recieverID,
            connectionID: connectionID,
            message: message,
        })
        await sendMessage.save();
        res.status(200).json({ message: "Message Sent ", chat: sendMessage })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// GET
// /api/connections/:connectionID/get-chats
const handleGetChats = async (req, res) => {
    try {

        const { connectionID } = req.params;

        const validateConnection = await ConnectionModel.findById(connectionID);
        if (!validateConnection) {
            return res.status(404).json({ message: "Connection Not Found" })
        }
        const findChats = await ChatModel.find({ connectionID: connectionID })
        res.status(200).json({ chatList: findChats })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}



export {
    HandleCreateConnection,
    HandleGetConnections,
    HandleChat,
    handleGetChats
}