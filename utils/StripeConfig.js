import "dotenv/config";
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined in the environment variables.");
}

const stripe = new Stripe(stripeKey, {
    apiVersion: '2022-11-15',
    typescript: true,
});

export default stripe