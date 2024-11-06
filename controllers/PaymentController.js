import Payment from '../models/PaymentModel.js';
import stripe from "../utils/StripeConfig.js";

const createPaymentIntent = async (req, res) => {
    const { userId, amount, currency } = req.body;

    try {
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

        console.log("-----------",payment);
        

        await payment.save();

        res.status(201).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ message: 'Payment processing failed', error });
    }
};

const getPaymentDetails = async (req, res) => {
    const { userId } = req.params;

    try {
        const payments = await Payment.find({ userId });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payment details', error });
    }
};

const updatePaymentStatus = async (req, res) => {
    const { paymentId, status } = req.body;

    try {
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