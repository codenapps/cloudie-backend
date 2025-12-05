import Payment from '../models/PaymentModel.js';
import stripe from "../utils/StripeConfig.js";

const createPaymentIntent = async (req, res) => {
    try {
        const { userId, amount, currency } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100,
            currency: currency || 'usd'
        });

        const payment = new Payment({
            userId,
            amount,
            currency: currency || 'usd',
            // paymentStatus,
            clientSecret: paymentIntent.client_secret
        });

        await payment.save();

        res.status(201).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Payment processing failed', error });
    }
};

const getPaymentDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const payments = await Payment.find({ userId });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payment details', error });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId, status } = req.body;
        const updatedPayment = await Payment.findByIdAndUpdate(
            paymentId,
            { paymentStatus: status },
            { new: true }
        );
        if (!updatedPayment) return res.status(404).json({ message: 'Payment not found' });
        res.json(updatedPayment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment status', error });
    }
};

export {
    createPaymentIntent,
    getPaymentDetails,
    updatePaymentStatus
}