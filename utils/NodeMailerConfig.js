import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: process.env.NODE_MAILER_USER,
        pass: process.env.NODE_MAILER_PASS
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;
