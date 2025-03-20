import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'team@codenapps.com',
        // pass: 'yebb sizs pfsx tuos'
        pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;