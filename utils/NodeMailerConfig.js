import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'team@codenapps.com',
        pass: 'iemc prpu lvzi tpre'
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;
