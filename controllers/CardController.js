import Stripe from 'stripe';
import Card from '../models/CardModel.js';
import User from '../models/User.js';

const stripe = new Stripe("sk_test_51QePvkArP8SrFQvbyuj6Tve2Nw504Ef9beVL24eFCUjgprmGlfnjEQpJkEChOKMlSBeK4vzoed5OJ3oUsDZeYvzC00oVh0ZEe1");


const addCard = async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.username,
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }

        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: stripeCustomerId,
        });

        await stripe.customers.update(stripeCustomerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        const { brand, last4, exp_month, exp_year } = paymentMethod.card;

        const existingCard = await Card.findOne({
            userId,
            stripePaymentMethodId: paymentMethodId
        });

        if (existingCard) {
            return res.status(400).json({ message: 'Card already added' });
        }

        await Card.updateMany({ userId }, { isDefault: false });

        const newCard = await Card.create({
            userId,
            stripeCustomerId,
            stripePaymentMethodId: paymentMethodId,
            brand,
            last4,
            expMonth: exp_month,
            expYear: exp_year,
            isDefault: true,
        });

        res.status(200).json({
            message: 'Card added successfully',
            card: newCard
        });

    } catch (error) {
        console.error('Error adding card:', error);
        res.status(500).json({
            message: 'Error adding card',
            error: error.message
        });
    }
};

const getUserCards = async (req, res) => {
    try {
        const { userId } = req.params;
        const cards = await Card.find({ userId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cards', error: error.message });
    }
};

// const updateCard = async (req, res) => {
//     try {
//         const { cardId } = req.params;
//         const { makeDefault, expMonth, expYear } = req.body;

//         const card = await Card.findById(cardId);
//         if (!card) return res.status(404).json({ message: 'Card not found' });

//         if (makeDefault) {
//             await stripe.customers.update(card.stripeCustomerId, {
//                 invoice_settings: { default_payment_method: card.stripePaymentMethodId },
//             });

//             await Card.updateMany(
//                 { userId: card.userId },
//                 { $set: { isDefault: false } }
//             );

//             card.isDefault = true;
//         }

//         if (expMonth || expYear) {
//             const updated = await stripe.paymentMethods.update(
//                 card.stripePaymentMethodId,
//                 { card: { exp_month: expMonth, exp_year: expYear } }
//             );

//             card.expMonth = updated.card.exp_month;
//             card.expYear = updated.card.exp_year;
//         }

//         await card.save();

//         res.status(200).json({
//             message: 'Card updated successfully',
//             card
//         });

//     } catch (error) {
//         console.error('Error updating card:', error);
//         res.status(500).json({
//             message: 'Error updating card',
//             error: error.message
//         });
//     }
// };

const updateCard = async (req, res) => {
    try {
        const { cardId } = req.params;
        const { paymentMethodId, makeDefault, expMonth, expYear } = req.body;

        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        if (paymentMethodId) {
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: card.stripeCustomerId,
            });

            if (makeDefault) {
                await stripe.customers.update(card.stripeCustomerId, {
                    invoice_settings: { default_payment_method: paymentMethodId },
                });
            }

            const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

            card.stripePaymentMethodId = pm.id;
            card.brand = pm.card.brand;
            card.last4 = pm.card.last4;
            card.expMonth = pm.card.exp_month;
            card.expYear = pm.card.exp_year;
        }

        if ((expMonth || expYear) && !paymentMethodId) {
            const updated = await stripe.paymentMethods.update(card.stripePaymentMethodId, {
                card: { exp_month: expMonth, exp_year: expYear }
            });
            card.expMonth = updated.card.exp_month;
            card.expYear = updated.card.exp_year;
        }

        if (makeDefault) {
            await Card.updateMany(
                { userId: card.userId },
                { $set: { isDefault: false } }
            );
            card.isDefault = true;

            if (!paymentMethodId) {
                await stripe.customers.update(card.stripeCustomerId, {
                    invoice_settings: { default_payment_method: card.stripePaymentMethodId },
                });
            }
        }

        await card.save();
        res.json({ message: 'Card updated successfully', card });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating card', error: error.message });
    }
};

export { addCard, getUserCards, updateCard }