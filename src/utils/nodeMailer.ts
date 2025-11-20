import nodemailer, { Transporter } from "nodemailer";
import { config } from "../config.js";

export const mailer: Transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  return mailer.sendMail({
    from: config.email.from,
    ...options,
  });
}
