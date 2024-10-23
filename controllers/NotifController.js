import AdminModel from "../models/AdminModel.js";
import NotificationsModel from "../models/NotificationsModel.js";
import RiderModel from "../models/RiderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";


const HandlePostNotif = async (req, res) => {
    try {

        const { userID } = req.params;
        const { text } = req.body;

        const createNotif = new NotificationsModel({
            userID,
            text
        })
        await createNotif.save();
        res.status(201).json(createNotif)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Request" });
    }
}

const HandleGetNotifications = async (req, res) => {
    try {
        const { userID } = req.params;
        const notifications = await NotificationsModel.find({ userID }).sort({ createdAt: -1 });
        const unread = await NotificationsModel.countDocuments({ userID: userID, read: false }).sort({ createdAt: -1 });
        res.status(200).json({ notifications, unread: unread })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Request" });
    }
}

const HandleReadNotif = async (req, res) => {
    try {
        const { userID } = req.params;
        const { reciever } = req.query;

        if (!reciever) {
            const bulkOps = [
                {
                    updateMany: {
                        filter: {
                            userID: userID,
                        },
                        update: { $set: { read: true } }
                    }
                }
            ];

            // Execute the bulkWrite operation
            const notif = await NotificationsModel.bulkWrite(bulkOps);
            return res.status(200).json({ message: "Notifications updated", updatedCount: notif.modifiedCount });

        }

        // Find the user role based on the receiver
        const findRoles = await AdminModel.findOne({ username: reciever })
            || await User.findOne({ storeName: reciever })
            || await StoreOwnerModel.findOne({ storeName: reciever });

        if (!findRoles) {
            return res.status(404).json({ message: "No User Found" });
        }

        // Determine the name based on the role
        let name;
        if (findRoles.role && findRoles.role.includes('StoreOwner')) {
            name = findRoles.storeName;
        } else {
            name = findRoles.username;
        }

        // Construct a regex pattern to match the text
        const regexPattern = new RegExp(`${name}\\s+sent\\s+you\\s+a\\s+message`, 'i');

        // Log the pattern and name to debug

        // Update all matching notifications using bulkWrite
        const bulkOps = [
            {
                updateMany: {
                    filter: {
                        userID: userID,
                        text: { $regex: regexPattern }
                    },
                    update: { $set: { read: true } }
                }
            }
        ];

        // Execute the bulkWrite operation
        const notif = await NotificationsModel.bulkWrite(bulkOps);

        // Log the result and respond with the number of documents updated
        console.log('Update Result:', notif.modifiedCount);
        res.status(200).json({ message: "Notifications updated", updatedCount: notif.modifiedCount });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};




export {
    HandlePostNotif,
    HandleGetNotifications,
    HandleReadNotif
}