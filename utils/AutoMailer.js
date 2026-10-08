import transporter from "./NodeMailerConfig.js";

const autoMailer = ({ to, subject, message }) => {
    try {
        const mailOptions = {
            from: process.env.NODE_MAILER_USER,
            to: to,
            subject: subject,
            html: message,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
    } catch (error) {
        console.log(error);
        console.log("Automailer Error Occurred");
    }
};

export default autoMailer;