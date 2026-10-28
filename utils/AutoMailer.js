import transporter from "./NodeMailerConfig.js";

const SEND_TIMEOUT_MS = 20_000;

function getFromEmail() {
  return (
    process.env.EMAIL_FROM ||
    process.env.MAIL_FROM ||
    process.env.NODE_MAILER_FROM ||
    process.env.NODE_MAILER_USER
  );
}

function formatFromHeader() {
  const email = getFromEmail();
  if (!email) {
    return null;
  }
  if (email.includes("<")) {
    return email;
  }
  const name =
    process.env.EMAIL_FROM_NAME?.replace(/^["']|["']$/g, "").trim() ||
    "Cloudie";
  return `${name} <${email.trim()}>`;
}

async function sendViaResend({ to, subject, message }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const from = formatFromHeader();
  if (!from) {
    throw new Error(
      "EMAIL_FROM, MAIL_FROM, or NODE_MAILER_USER is required for Resend",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: message,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}

async function sendViaSmtp({ to, subject, message }) {
  const from = formatFromHeader() || getFromEmail();
  const mailOptions = {
    from,
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
}

const autoMailer = async ({ to, subject, message }) => {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ to, subject, message });
    return;
  }
  await sendViaSmtp({ to, subject, message });
};

export default autoMailer;
