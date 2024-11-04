import ReviewModel from '../models/reviewModel.js';
import ProductModel from '../models/productModel.js';
import UserModel from '../models/userModel.js';

export const createReview = async (req, res) => {
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
            user: userId,
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

export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await ReviewModel.find({ product: productId })
            .populate('user', 'username profile_image')
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