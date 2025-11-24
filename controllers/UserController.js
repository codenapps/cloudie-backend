import AdminModel from "../models/AdminModel.js";
import RiderModel from "../models/RiderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import autoMailer from "../utils/AutoMailer.js";

const HandleGetAllUsers = (req, res) => {
    try {
        res.send("MVC WORKING, Welcome");
    } catch (error) {
        console.log(error);
    }
}

// @POST 
// /api/user/signup-user
const HandleSignupUser = async (req, res) => {
    try {

        const {
            username,
            email,
            password,
            city,
            state,
            country,
            addressLine,
            postalCode,
            phone,
            userLatitude,
            userLongitude
        } = req.body;

        const existingUser = await StoreOwnerModel.findOne({
            $or: [
                { email }]
        }) || await AdminModel.findOne({
            $or: [
                { email }
            ]
        }) || await User.findOne({
            $or: [
                { email }
            ]
        })

        if (existingUser) {
            return res.status(400).json({ message: "User With This Email Already Exists" })
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const getOtpCode = otpCode;
        const getOtpExpire = Date.now() + 600000;

        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password,
            city,
            state,
            country,
            addressLine,
            postalCode,
            phone,
            userLatitude,
            userLongitude,
            OtpCode: getOtpCode,
            OtpExp: getOtpExpire,
        })

        await newUser.save();

        const token = {
            _id: newUser._id.toString(),
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
            city: newUser.city,
            state: newUser.state,
            country: newUser.country,
            phone: newUser.phone,
            addressLine: newUser.addressLine,
            postalCode: newUser.postalCode,
            status: newUser.status,
            isOtpVerified: newUser.isOtpVerified
        }

        try {
            autoMailer({
                to: newUser.email,
                subject: 'OTP VERIFICATION CODE',
                message: `<h3>Your OTP Verification Code Is: </h3><h3>${newUser.OtpCode}</h3>`
            });
        } catch (error) {
            console.log('Error sending OTP email:', error);
            return res.status(500).json({ message: "Failed to send OTP email" });
        }

        res.status(201).json({ message: "Registered Successfully", token: token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH 
// /api/user/verify-user
const HandleVerifyUserOtp = async (req, res) => {
    try {
        const { email, OtpCode } = req.body;
        const findUser = await User.findOne({ email: email })

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
                isOtpVerified: findUser.isOtpVerified
            }
            return res.status(200).json({ message: "OTP Verified Successfully", token });

        } else {
            return res.status(404).json({ message: "OTP has expired or is invalid" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" })
    }
}

// @PATCH 
// /api/user/:userID/update-user
const HandleUpdateUser = async (req, res) => {
    try {

        const {
            userID
        } = req.params;

        const {
            username,
            email,
            password,
            city,
            state,
            country,
            addressLine,
            phone,
            postalCode,
            userLatitude,
            userLongitude
        } = req.body;

        const findUser = await User.findById(userID);
        if (!findUser) {
            return res.status(404).json({ message: "User Not Found" });
        }


        findUser.username = username || findUser.username
        findUser.email = email?.toLowerCase() || findUser.email
        findUser.password = password || findUser.password
        findUser.city = city || findUser.city
        findUser.state = state || findUser.state
        findUser.country = country || findUser.country
        findUser.phone = phone || findUser.phone
        findUser.addressLine = addressLine || findUser.addressLine
        findUser.postalCode = postalCode || findUser.postalCode
        findUser.userLatitude = userLatitude || findUser.userLatitude
        findUser.userLongitude = userLongitude || findUser.userLongitude
        console.log(findUser, "findUser");

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
            phone: findUser.phone,
            postalCode: findUser.postalCode,
            isOtpVerified: findUser.isOtpVerified
        }

        res.status(200).json({ message: "User updated successfully", token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @GET 
// /api/user/get-user/:userID
const HandleGetSingleUser = async (req, res) => {
    try {
        const { userID } = req.params;
        const findUser = await User.findById(userID) || await RiderModel.findById(userID);
        if (!findUser) {
            return res.status(404).json({ message: "Invalid Request" });
        }
        res.status(200).json({ user: findUser })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

const HandleGetAllUser = async (req, res) => {
    try {
        let { page = 1, limit = 5 } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1 || limit > 100) limit = 5;

        const [users, riders] = await Promise.all([
            User.find(),
            RiderModel.find()
        ]);

        let allData = [...users, ...riders];

        allData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total = allData.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const paginatedData = allData.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            users: paginatedData
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};




export { HandleGetAllUsers, HandleSignupUser, HandleVerifyUserOtp, HandleUpdateUser, HandleGetSingleUser, HandleGetAllUser };