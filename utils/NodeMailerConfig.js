import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'abdulrehmaneugbs@gmail.com',
        pass: 'yebb sizs pfsx tuos'
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;