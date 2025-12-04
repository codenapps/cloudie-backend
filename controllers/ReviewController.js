import ReviewModel from '../models/ReviewModel.js';
import ProductModel from '../models/ProductModel.js';
import UserModel from '../models/User.js';
import ReviewRiderSchema from '../models/RiderReviewModel.js';
import mongoose from 'mongoose';

const createReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId, rating, comment } = req.body;

        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const existingReview = await ReviewModel.findOne({ product: productId, user: userId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const newReview = new ReviewModel({
            product: productId,
            userId: userId,
            rating,
            comment,
        });

        await newReview.save();

        res.status(201).json({ message: 'Review created successfully', review: newReview });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await ReviewModel.find({ product: productId })
            .populate('userId', 'username profile_image')
            .sort({ createdAt: -1 });

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this product' });
        }

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const createRiderReview = async (req, res) => {
    try {
        const { userId } = req.params;
        const { rating, comment } = req.body;

        console.log("REQ PARAM userId:", userId);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const newReview = new ReviewRiderSchema({
            user: userId,
            rating,
            comment,
        });

        await newReview.save();

        res.status(201).json({
            message: "Review created successfully",
            review: newReview,
        });

    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getRiderReviews = async (req, res) => {
    try {
        const { userId } = req.params;

        const reviews = await ReviewRiderSchema.find({ user: userId })
            .populate('user', 'username profile_image')
            .sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for this Rider' });
        }

        console.log(reviews, "reviews");


        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export {
    getProductReviews,
    createReview,
    createRiderReview,
    getRiderReviews
}