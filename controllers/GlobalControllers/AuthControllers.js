import AdminModel from "../../models/AdminModel.js";
import RiderModel from "../../models/RiderModel.js";
import StoreOwnerModel from "../../models/StoreOwnerModel.js";
import User from "../../models/User.js";
import SubscriptionModel from "../../models/SubscriptionModel.js";
import autoMailer from "../../utils/AutoMailer.js";


// @POST
// ENDPOINT: /api/global/login
const HandleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const findRoles = await AdminModel.findOne({ email, password })
            || await User.findOne({ email, password })
            || await StoreOwnerModel.findOne({ email, password }) || await RiderModel.findOne({ email, password });

        if (!findRoles) {
            return res.status(404).json({ message: "Invalid Credentials" })
        }

        if (email !== findRoles.email || password !== findRoles.password) {
            return res.status(400).json({ message: "Invalid Credentials" })
        }

        if (findRoles.role.includes('User')) {
            const token = {
                _id: findRoles._id.toString(),
                username: findRoles.username,
                email: findRoles.email,
                role: findRoles.role,
                profile_image: findRoles.profile_image
            }
            return res.status(200).json({ message: "Logged In Successfully", token });
        } else if (findRoles.role.includes('StoreOwner')) {
            const validatePlan = await SubscriptionModel.findOne({ storeID: findRoles._id, status: ["Active"] });

            const token = {
                _id: findRoles._id.toString(),
                username: findRoles.storeName,
                email: findRoles.email,
                password: findRoles.password,
                role: findRoles.role,
                description: findRoles.description,
                city: findRoles.city,
                state: findRoles.state,
                country: findRoles.country,
                addressLine: findRoles.addressLine,
                postalCode: findRoles.postalCode,
                status: findRoles.status,
                verified: findRoles.verified,
                isOtpVerified: findRoles.isOtpVerified,
                isSubscribed: validatePlan ? true : false,
                planID: validatePlan ? validatePlan.planID : "",
                planDuration: validatePlan ? validatePlan.duration[0] : "No Subscription",
                storeStatus: findRoles.storeStatus
            }

            return res.status(200).json({ message: 'Logged In Successfully', token })
        } else if (findRoles.role.includes('Rider')) {

            const token = {
                _id: findRoles._id.toString(),
                username: findRoles.username,
                email: findRoles.email,
                password: findRoles.password,
                role: findRoles.role,
                phone: findRoles.phone,
                vehicleType: findRoles.vehicleType,
                city: findRoles.city,
                state: findRoles.state,
                country: findRoles.country,
                addressLine: findRoles.addressLine,
                profile_image: findRoles.profile_image,
                w9form: findRoles.w9form,
                postalCode: findRoles.postalCode,
                status: findRoles.status,
                verified: findRoles.verified,
                isOtpVerified: findRoles.isOtpVerified
            }

            return res.status(200).json({ message: 'Logged In Successfully', token })
        } else if (findRoles.role.includes('Admin')) {
            const token = {
                _id: findRoles._id.toString(),
                username: findRoles.username,
                email: findRoles.email,
                password: findRoles.password,
                role: findRoles.role,
            }
            return res.status(200).json({ message: 'Logged In Successfully', token })
        } else {
            res.status(403).json({ message: 'Invalid Login Request' })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// @PATCH
// ENDPOINT: /api/global/forget-password 
const HandleForgotPassword = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const findUser =
            (await User.findOne({ email: normalizedEmail })) ||
            (await AdminModel.findOne({ email: normalizedEmail })) ||
            (await StoreOwnerModel.findOne({ email: normalizedEmail })) ||
            (await RiderModel.findOne({ email: normalizedEmail }));

        if (!findUser) {
            return res.status(404).json({ message: "Sorry, Account With This Email Doesn't Exists" })
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000);

        findUser.OtpCode = otpCode;
        findUser.OtpExp = Date.now() + 600000;

        await findUser.save();

        try {
            await autoMailer({
                to: findUser.email,
                subject: 'OTP VERIFICATION CODE',
                message: `<h3>Your OTP Verification Code Is: </h3><h3>${otpCode}</h3>`,
            });
        } catch (mailError) {
            console.log('Forgot-password email failed:', mailError);
            return res.status(500).json({ message: "Failed to send OTP email" });
        }

        res.status(200).json({ message: "OTP Sent To Your Email" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}

// @PATCH
// ENDPOINT: /api/global/verify-otp 
const HandleVerifyOtp = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
        const { OtpCode } = req.body;
        const findUser =
            (await AdminModel.findOne({ email: normalizedEmail })) ||
            (await User.findOne({ email: normalizedEmail })) ||
            (await StoreOwnerModel.findOne({ email: normalizedEmail }));

        if (!findUser) {
            return res.status(404).json({ message: "Sorry, We couldn't send your OTP Verification Code" });
        }

        if (OtpCode === "" || OtpCode == null) {
            return res.status(404).json({ message: "OTP Field Is Required" })
        }
        if (findUser.OtpCode !== Number(OtpCode)) {
            return res.status(404).json({ message: "Invalid OTP Verification Code" })
        }
        if (findUser.OtpCode === Number(OtpCode) && findUser.OtpExp && findUser.OtpExp > Date.now()) {
            return res.status(200).json({ message: "OTP Verified Successfully" })
        } else {
            return res.status(404).json({ message: "OTP has expired or is invalid" });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}

// @PATCH
// ENDPOINT: /api/global/reset-password 
const HandleResetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        const findUser = (
            await AdminModel.findOne({ email: email }) ||
            await User.findOne({ email: email }) ||
            await StoreOwnerModel.findOne({ email: email })
        );

        if (!findUser) {
            return res.status(404).json({ message: "Sorry, Some Error Occured While Resetting Password" })
        }

        if (password !== confirmPassword) {
            return res.status(404).json({ message: "Passwords Must Be Same" });
        }

        findUser.password = password || findUser.password
        await findUser.save();
        res.status(200).json({ message: "Password Reset Successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

// @PATCH
// ENDPOINT: /api/global/resend-otp
const HandleResendOtp = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
        if (!normalizedEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const userExists =
            (await AdminModel.findOne({ email: normalizedEmail })) ||
            (await User.findOne({ email: normalizedEmail })) ||
            (await StoreOwnerModel.findOne({ email: normalizedEmail }));
        if (!userExists) {
            return res.status(404).json({ message: "This Email Doesn't Exist" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000);

        userExists.OtpCode = otpCode;
        userExists.OtpExp = Date.now() + 600000;

        await userExists.save();

        try {
            await autoMailer({
                to: userExists.email,
                subject: 'OTP VERIFICATION CODE',
                message: `<h3>Your OTP Verification Code Is: </h3><h3>${otpCode}</h3>`,
            });
        } catch (mailError) {
            console.log('Resend OTP email failed:', mailError);
            return res.status(500).json({ message: "Failed to send OTP email" });
        }

        res.status(200).json({ message: "OTP Re-Sent Successfully To Your Email" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" })
    }
}

export {
    HandleLogin,
    HandleForgotPassword,
    HandleVerifyOtp,
    HandleResetPassword,
    HandleResendOtp
}