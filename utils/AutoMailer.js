import transporter from "./NodeMailerConfig.js";

const autoMailer = async ({ to, subject, message }) => {
  const mailOptions = {
    from: process.env.NODE_MAILER_USER,
    to,
    subject,
    html: message,
  };

  return transporter.sendMail(mailOptions);
};

export default autoMailer;
