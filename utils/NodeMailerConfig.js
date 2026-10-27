import "dotenv/config";
import nodemailer from "nodemailer";

const port = Number(process.env.NODE_MAILER_PORT || 587);
const secure =
  process.env.NODE_MAILER_SECURE === "true" || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.NODE_MAILER_HOST || "smtp.gmail.com",
  port,
  secure,
  requireTLS: !secure,
  auth: {
    user: process.env.NODE_MAILER_USER,
    pass: process.env.NODE_MAILER_PASS?.replace(/\s/g, ""),
  },
  connectionTimeout: 12_000,
  greetingTimeout: 12_000,
  socketTimeout: 20_000,
});

export default transporter;
