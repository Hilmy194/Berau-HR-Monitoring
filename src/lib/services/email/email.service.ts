import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER || "izaky.thb@gmail.com";
  const pass = (process.env.SMTP_PASS || "fbilodoqwvjxqkty").replace(/\s+/g, "");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendHarmoniEmail({ to, subject, html, text }: EmailPayload) {
  try {
    const mailer = getTransporter();
    const fromName = process.env.SMTP_FROM_NAME || "Harmoni System";
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "izaky.thb@gmail.com";

    const info = await mailer.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ""),
    });

    console.log(`[Harmoni Email] Sent successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Harmoni Email Error] Failed to send email to ${to}:`, error);
    return { success: false, error: error?.message || "Failed to send email" };
  }
}
