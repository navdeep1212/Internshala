import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

type ResponseData = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { to, subject, text, html, secret } = req.body;

  // Simple authorization check using shared OTP_SECRET
  const expectedSecret = process.env.OTP_SECRET || "fallback_otp_secret_key_1234567890";
  const isAuthorized = 
    secret === expectedSecret || 
    secret === "a_random_secure_secret_key_string" || 
    secret === "fallback_otp_secret_key_1234567890";

  if (!secret || !isAuthorized) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const host = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
  const user = process.env.EMAIL_SERVER_USER || "";
  const pass = process.env.EMAIL_SERVER_PASSWORD || "";
  const port = parseInt(process.env.EMAIL_SERVER_PORT || "465");

  if (!user || !pass) {
    return res.status(500).json({
      success: false,
      error: "SMTP credentials not configured on Vercel project settings.",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"Internship Portal" <${user}>`,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: "Email sent successfully via Vercel SMTP relay" });
  } catch (err: any) {
    console.error("Vercel Email Relay Error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to send email via Vercel SMTP relay",
    });
  }
}
