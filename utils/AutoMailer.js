// import transporter from "./NodeMailerConfig.js";

// const autoMailer = ({ from = 'jackhanry9013@gmail.com', to, subject, message }) => {
//     try {
//         const mailOptions = {
//             from: from,
//             to: to,
//             subject: subject,
//             html: message,
//         };

//         transporter.sendMail(mailOptions, (err, info) => {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log("Email sent: " + info.response);
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         console.log("Automailer Error Occurred");
//     }
// };

// export default autoMailer;

import transporter from "./NodeMailerConfig.js";

const autoMailer = ({ to, subject, message }) => {
    try {
        const mailOptions = {
            to: to,
            subject: subject,
            html: message,
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("Error sending email:", err);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
    } catch (error) {
        console.log("Automailer Error Occurred:", error);
    }
};

export default autoMailer;
