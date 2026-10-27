import transporter from "./NodeMailerConfig.js";

const SEND_TIMEOUT_MS = 20_000;

const autoMailer = async ({ to, subject, message }) => {
  const mailOptions = {
    from: process.env.NODE_MAILER_USER,
    to,
    subject,
    html: message,
  };

  await Promise.race([
    transporter.sendMail(mailOptions),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Email send timed out")),
        SEND_TIMEOUT_MS,
      );
    }),
  ]);
};

export default autoMailer;
