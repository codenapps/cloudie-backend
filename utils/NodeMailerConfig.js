import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'team@codenapps.com',
        pass: 'Security2025@'
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;