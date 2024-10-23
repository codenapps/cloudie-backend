import moment from 'moment';
import fs from "fs"
import stripe from '../utils/StripeConfig.js';


const HandleSubscribePlan = async (req, res) => {
    try {
        // Convert dob to YYYY-MM-DD format
        const dob = '12/4/2002';
        const [month, day, year] = dob.split('/');
        const formattedDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const backFile = req.files.back;
        const frontFile = req.files.front;

        // Read file data
        const backFileData = fs.readFileSync(backFile.tempFilePath);
        const frontFileData = fs.readFileSync(frontFile.tempFilePath);

        // Create Stripe files using file data
        const back = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: backFileData,
                name: backFile.name,
                type: 'application/octet-stream',
            },
        });

        const front = await stripe.files.create({
            purpose: 'identity_document',
            file: {
                data: frontFileData,
                name: frontFile.name,
                type: 'application/octet-stream',
            },
        });

        // Create Stripe account
        const account = await stripe.accounts.create({
            country: 'US',
            type: 'custom',
            email: "testuser@gmail.com",
            business_type: 'individual',
            business_profile: {
                url: "https://mynextek.vercel.app"
            },
            individual: {
                first_name: 'Test Stripe Acc',
                last_name: " ",
                dob: {
                    day: 12,
                    month: 6,
                    year: 2002,
                },
                ssn_last_4: 8888,
                verification: {
                    document: {
                        back: back.id,
                        front: front.id,
                    }
                }
            },
            external_account: {
                object: 'card',
                currency: 'usd',
                number: 4000056655665556,
                exp_month: '06',
                exp_year: '2028',
                cvc: '567',
            },
            capabilities: {
                transfers: {
                    requested: true,
                },
            },
        });

        if (!account) {
            return res.status(403).send({ message: "Error Occured While Processing Account" });
        }

        // Accept TOS
        await stripe.accounts.update(account.id, {
            tos_acceptance: {
                date: Math.floor(Date.now() / 1000),
                ip: '8.8.8.8',
            }
        });

        // Update capabilities
        await stripe.accounts.updateCapability(account.id, 'transfers', {
            requested: true,
        });

        res.status(200).json(account);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export {
    HandleSubscribePlan
}


// Create a stripe connect onboarding process api 
