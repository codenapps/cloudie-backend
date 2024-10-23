import AdminModel from "../models/AdminModel.js";
import RiderModel from "../models/RiderModel.js";
import StoreOwnerModel from "../models/StoreOwnerModel.js";
import User from "../models/User.js";
import autoMailer from "../utils/AutoMailer.js";
import { generatePass } from "../utils/PasswordGenerator.js";

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

            // Validate emails first
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

            // If all emails are valid, proceed to create riders and send emails
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
            postalCode
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
        await findRider.save();

        autoMailer(
            {
                from: 'wasifmehmood903@gmail.com',
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
            isOtpVerified: findRider.isOtpVerified
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
                isOtpVerified: findUser.isOtpVerified
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
        const { page = 1, limit = 10 } = req.query;

        const findUser = await AdminModel.findById(id);
        if (!findUser.role.includes("Admin")) {
            return res.status(404).json({ message: "Unauthorized" });
        }
        const totalPages = await RiderModel.countDocuments().exec();
        const AllRiders = await RiderModel.find().limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
        res.status(200).json({
            AllRiders: AllRiders,
            totalPages: Math.ceil(totalPages / limit),
            currentPage: Number(page),
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

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
            isOtpVerified: findRider.isOtpVerified
        }

        res.status(200).json({ message: "Rider Updated Successfully", token });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export {
    HandleInviteRiders,
    HandleSubmitVerification,
    RiderOtpVerify,
    HandleGetRiders,
    HandleUpdateRiders
}