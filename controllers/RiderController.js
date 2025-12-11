import AdminModel from "../models/AdminModel.js";
import RiderModel from "../models/RiderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import autoMailer from "../utils/AutoMailer.js";
import { generatePass } from "../utils/PasswordGenerator.js";
import Order from "../models/OrderModel.js";
import { v2 as cloudinary } from "cloudinary";


// @PATCH
// /api/riders/adminID/create-riders
const HandleInviteRiders = async (req, res) => {
    try {
        const { adminID } = req.params;
        const { inviteList, inviteType } = req.body;

        const findAdmin = await AdminModel.findById(adminID);

        if (!findAdmin) {
            return res.status(404).json({ message: "Unauthorized" });
        }

        if (inviteType === 'file') {
            return res.status(403).json({ message: "Under Development" });
        } else if (inviteType === "list") {
            if (!Array.isArray(inviteList)) {
                return res.status(400).json({ message: 'Invalid invite list format' });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            const validationResults = await Promise.all(inviteList.map(async (item) => {
                if (!emailRegex.test(item)) {
                    return { email: item, error: 'Invalid email format' };
                }

                const emailValidator = await User.findOne({ email: item }) || await RiderModel.findOne({ email: item }) || await StoreOwnerModel.findOne({ email: item }) || await AdminModel.findOne({ email: item });

                if (emailValidator) {
                    return { email: item, error: 'Email already exists' };
                }

                return { email: item, error: null };
            }));

            const invalidEmails = validationResults.filter(result => result.error !== null);
            if (invalidEmails.length > 0) {
                const errorMessages = invalidEmails.map(result => `${result.email}: ${result.error}`).join(', ');
                return res.status(400).json({ message: `Validation failed: ${errorMessages}` });
            }

            const createRiders = await Promise.all(validationResults.map(async (result) => {
                const password = generatePass();
                const createRider = new RiderModel({
                    email: result.email,
                    password: password,
                });
                await createRider.save();

                await autoMailer({
                    from: findAdmin.email,
                    to: result.email,
                    subject: `Congrats!!! You've Been Invited To Cloudie To Work As A Partner!`,
                    message: `
                        <h3>Here Is Your Email: ${result.email} </h3>
                        <h3>Here Is Your Password: ${password}</h3>
                        <h3> Click Here To Login Now ! </h3>
                    `,
                });
            }));

            return res.status(200).json({ message: "Invitations Sent Successfully" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @PATCH
// /api/riders/riderID/submit-rider-verification
const HandleSubmitVerification = async (req, res) => {
    try {
        const { riderID } = req.params;
        const {
            username,
            phone,
            verified,
            vehicleType,
            city,
            state,
            country,
            addressLine,
            postalCode,
            riderLatitude,
            riderLongitude
        } = req.body;

        const findRider = await RiderModel.findById(riderID);
        if (!findRider) {
            return res.status(404).json({ message: "Rider Not Found" });
        }

        const w9form = req?.files?.w9form;
        const profile_image = req?.files?.profile_image;

        const w9formResult = w9form ? await cloudinary.uploader.upload(w9form.tempFilePath, {
            resource_type: 'image',
            folder: "riders-w9",
        }) : '';

        const profileImgResult = profile_image ? await cloudinary.uploader.upload(profile_image.tempFilePath, {
            resource_type: 'image',
            folder: "riders-w9",
        }) : findRider.profile_image;

        const otpCode = await Math.floor(
            100000 + Math.random() * 900000
        ).toString();
        const getOtpCode = otpCode;
        const getOtpExpire = Date.now() + 600000;

        findRider.username = username || findRider.username
        findRider.w9form = w9formResult.secure_url || findRider.w9form
        findRider.phone = phone || findRider.phone
        findRider.verified = verified || findRider.verified
        findRider.vehicleType = vehicleType || findRider.vehicleType
        findRider.OtpCode = getOtpCode || findRider.OtpCode
        findRider.OtpExp = getOtpExpire || findRider.OtpExp
        findRider.city = city || findRider.city
        findRider.state = state || findRider.state
        findRider.country = country || findRider.country
        findRider.addressLine = addressLine || findRider.addressLine
        findRider.profile_image = profileImgResult.secure_url || findRider.profile_image
        findRider.postalCode = postalCode || findRider.postalCode
        findRider.riderLatitude = riderLatitude || findRider.riderLatitude
        findRider.riderLongitude = riderLongitude || findRider.riderLongitude

        await findRider.save();

        autoMailer(
            {
                from: 'team@codenapps.com',
                to: findRider.email,
                subject: 'OTP VERIFICATION CODE',
                message: `<h3>Your OTP Verification Code Is: </h3>
                <h3> ${findRider.OtpCode}</h4>`
            }
        );

        const token = {
            _id: findRider._id.toString(),
            username: findRider.username,
            email: findRider.email,
            password: findRider.password,
            role: findRider.role,
            phone: findRider.phone,
            vehicleType: findRider.vehicleType,
            city: findRider.city,
            state: findRider.state,
            country: findRider.country,
            addressLine: findRider.addressLine,
            profile_image: findRider.profile_image,
            w9form: findRider.w9form,
            postalCode: findRider.postalCode,
            status: findRider.status,
            verified: findRider.verified,
            isOtpVerified: findRider.isOtpVerified,
            riderLatitude: findRider.riderLatitude,
            riderLongitude: findRider.riderLongitude
        }

        return res.status(200).json({ message: "Verification Submitted Successfully", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH
// /api/riders/verify-rider
const RiderOtpVerify = async (req, res) => {
    try {
        const { email, OtpCode } = req.body;
        const findUser = await RiderModel.findOne({ email: email })

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
                city: findUser.city,
                state: findUser.state,
                country: findUser.country,
                addressLine: findUser.addressLine,
                postalCode: findUser.postalCode,
                status: findUser.status,
                verified: findUser.verified,
                isOtpVerified: findUser.isOtpVerified,
                riderLatitude: findUser.riderLatitude,
                riderLongitude: findUser.riderLongitude
            }

            return res.status(200).json({ message: "OTP Verified Successfully", token });
        } else {
            return res.status(404).json({ message: "OTP has expired or is invalid" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET
// /api/riders/:id/get-riders
const HandleGetRiders = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10, keyword = "" } = req.query;

        const findUser = await AdminModel.findById(id);
        if (!findUser || !findUser.role.includes("Admin")) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        let filter = {};
        if (keyword) {
            filter = {
                $or: [
                    { username: { $regex: keyword, $options: "i" } },
                    { email: { $regex: keyword, $options: "i" } },
                    // { phone: { $regex: keyword, $options: i } }
                ]
            };
        }

        const totalRiders = await RiderModel.countDocuments(filter);

        const allRiders = await RiderModel.find(filter)
            .limit(limitNumber)
            .skip(skip)
            .exec();

        res.status(200).json({
            allRiders,
            totalPages: Math.ceil(totalRiders / limitNumber),
            currentPage: pageNumber,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const HandleGetRidersForOrders = async (req, res) => {
    try {
        const allRiders = await RiderModel.find({ status: 'Active' }).exec();

        res.status(200).json({
            allRiders,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// @PATCH
// /api/riders/:riderID/update-riders
const HandleUpdateRiders = async (req, res) => {
    try {
        const {
            username,
            phone,
            verified,
            vehicleType,
            email,
            status,
            password,
            city,
            state,
            country,
            addressLine,
            postalCode,
            riderLongitude,
            riderLatitude
        } = req.body;

        const { riderID } = req.params;
        const findRider = await RiderModel.findById(riderID);
        if (!findRider) {
            return res.status(404).json({ message: "Rider Not Found" });
        }

        const w9form = req?.files?.w9form;
        const profile = req?.files?.profile;

        const w9formResult = w9form ? await cloudinary.uploader.upload(w9form.tempFilePath, {
            resource_type: 'image',
            folder: "riders-w9",
        }) : findRider.w9form;

        const profileResult = profile ? await cloudinary.uploader.upload(profile.tempFilePath, {
            resource_type: 'image',
            folder: "user",
        }) : findRider.profile_image;

        findRider.username = username || findRider.username
        findRider.phone = phone || findRider.phone
        findRider.email = email || findRider.email
        findRider.password = password || findRider.password
        findRider.verified = verified || findRider.verified
        findRider.vehicleType = vehicleType || findRider.vehicleType
        findRider.w9form = w9formResult?.secure_url || findRider.w9form
        findRider.profile_image = profileResult?.secure_url || findRider.profile_image
        findRider.status = status || findRider.status
        findRider.city = city || findRider.city
        findRider.state = state || findRider.state
        findRider.country = country || findRider.country
        findRider.addressLine = addressLine || findRider.addressLine
        findRider.postalCode = postalCode || findRider.postalCode
        findRider.riderLongitude = riderLongitude || findRider.riderLongitude
        findRider.riderLatitude = riderLatitude || findRider.riderLatitude

        await findRider.save();

        const token = {
            _id: findRider._id.toString(),
            username: findRider.username,
            email: findRider.email,
            password: findRider.password,
            role: findRider.role,
            phone: findRider.phone,
            vehicleType: findRider.vehicleType,
            city: findRider.city,
            state: findRider.state,
            country: findRider.country,
            addressLine: findRider.addressLine,
            profile_image: findRider.profile_image,
            w9form: findRider.w9form,
            postalCode: findRider.postalCode,
            vehicleType: findRider.vehicleType,
            status: findRider.status,
            verified: findRider.verified,
            isOtpVerified: findRider.isOtpVerified,
            riderLatitude: findRider.riderLatitude,
            riderLongitude: findRider.riderLongitude
        }

        res.status(200).json({ message: "Rider Updated Successfully", token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const getRidersWithAssignedOrders = async (req, res) => {
    try {
        const riders = await Order.aggregate([
            { $match: { assignedRider: { $ne: null } } },
            {
                $lookup: {
                    from: "riders",
                    localField: "assignedRider",
                    foreignField: "_id",
                    as: "rider"
                }
            },
            { $unwind: "$rider" },
            {
                $group: {
                    _id: "$assignedRider",
                    username: { $first: "$rider.username" },
                    email: { $first: "$rider.email" },
                    phone: { $first: "$rider.phone" },
                    totalAssignedOrders: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            message: "Riders with assigned orders fetched successfully",
            riders
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching riders",
            error: error.message
        });
    }
};

const getSingleRiderDetails = async (req, res) => {
    try {
        const { riderId } = req.params;

        const rider = await RiderModel.findById(riderId);
        if (!rider) {
            return res.status(404).json({ message: "Rider not found" });
        }

        const assignedOrders = await Order.find({
            assignedRider: riderId,
            status: { $ne: "Delivered" }
        })
            .populate("items.productId", "title price discountPrice")
            .populate("items.storeID", "storeName addressLine")
            .populate("userId", "username email phone addressLine")
            .sort({ createdAt: -1 });

        const deliveredOrders = await Order.find({
            assignedRider: riderId,
            status: "Delivered"
        }).populate("items.productId", "title price discountPrice")
            .populate("items.storeID", "storeName addressLine")
            .populate("userId", "username email phone addressLine")
            .sort({ createdAt: -1 });
        // .sort({ createdAt: -1 });

        return res.status(200).json({
            rider,
            assignedOrders,
            deliveredOrders
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching rider details",
            error: error.message
        });
    }
};


const getSingleRiderDeliveredOrders = async (req, res) => {
    try {
        const { riderId } = req.params;
        const rider = await RiderModel.findById(riderId);
        if (!rider) {
            return res.status(404).json({ message: "Rider not found" });
        }

        const assignedOrders = await Order.find({
            assignedRider: riderId
        });

        const assignedCount = assignedOrders.length;

        const deliveredCount = await Order.countDocuments({
            assignedRider: riderId,
            status: { $in: ["Delivered"] }
        });

        let totalEarnings = 0;

        assignedOrders.forEach(order => {
            const amount = order.totalAmount || 0;
            totalEarnings += amount * 0.03;
        });

        return res.status(200).json({
            rider: {
                riderId: rider._id,
                username: rider.username,
                email: rider.email,
                phone: rider.phone
            },
            assignedOrders: assignedCount,
            deliveredOrders: deliveredCount,
            totalEarnings: Number(totalEarnings.toFixed(2))
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error fetching rider chart data",
            error: error.message
        });
    }
};


export {
    HandleInviteRiders,
    HandleSubmitVerification,
    RiderOtpVerify,
    HandleGetRiders,
    HandleUpdateRiders,
    getRidersWithAssignedOrders,
    getSingleRiderDetails,
    getSingleRiderDeliveredOrders,
    HandleGetRidersForOrders
}