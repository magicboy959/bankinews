import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getMailerConfig() {
  const host = process.env.EMAIL_OUTGOING_HOST?.trim();
  const port = Number(process.env.EMAIL_SMTP_PORT ?? "465");
  const secure = (process.env.EMAIL_OUTGOING_SSL ?? "true").trim().toLowerCase() === "true";
  const user = process.env.EMAIL_USERNAME?.trim();
  const pass = process.env.EMAIL_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim() || user;

  if (!host || !user || !pass || !from) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

export async function sendSmtpEmail(input: SendEmailInput) {
  const config = getMailerConfig();
  if (!config) {
    return { sent: false as const, reason: "missing_smtp_config" as const };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { sent: true as const };
}
