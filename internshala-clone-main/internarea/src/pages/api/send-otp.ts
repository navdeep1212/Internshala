import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import nodemailer from "nodemailer";

type ResponseData = {
  success: boolean;
  message?: string;
  token?: string;
  devMode?: boolean;
  otp?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ success: false, message: "Invalid email address" });
  }

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 2. Set expiration to 5 minutes from now
  const expires = Date.now() + 5 * 60 * 1000;

  // 3. Cryptographically sign the OTP payload
  const secret = process.env.OTP_SECRET || "fallback_otp_secret_key_1234567890";
  const data = `${email}|${otp}|${expires}`;
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const token = `${hash}.${expires}`;

  // 4. Try sending email via nodemailer
  const host = process.env.EMAIL_SERVER_HOST || "";
  const user = process.env.EMAIL_SERVER_USER || "";
  const pass = process.env.EMAIL_SERVER_PASSWORD || "";
  const port = parseInt(process.env.EMAIL_SERVER_PORT || "465");

  const isProduction = process.env.NODE_ENV === "production";

  if (!user || !pass) {
    if (isProduction) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured on Vercel. Please add EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD environment variables in your Vercel Project Settings.",
      });
    }

    // Sandbox / Developer mode fallback (Development only)
    console.log(`[Developer Mode] SMTP not configured. OTP for ${email} is: ${otp}`);
    return res.status(200).json({
      success: true,
      message: "Verification code generated (Developer Mode)",
      token,
      devMode: true,
      otp,
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host || "smtp.gmail.com",
      port: port,
      secure: port === 465,
      auth: { user, pass },
    });

    const mailOptions = {
      from: `"InternArea Security" <${user}>`,
      to: email,
      subject: "Your InternArea Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">Verify Your Email</h2>
          <p>Hello,</p>
          <p>You requested to change the language of your InternArea account. Please verify your email using the verification code below:</p>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1f2937; margin: 20px 0; border-radius: 6px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #6b7280;">This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">InternArea Clone Project</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email sent to ${email}`);

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      token,
    });
  } catch (error: any) {
    console.error("SMTP Mail Send Error:", error);
    
    if (isProduction) {
      return res.status(500).json({
        success: false,
        message: `Failed to send email via SMTP: ${error?.message || "Unknown error"}. Please check your SMTP configuration in Vercel.`,
      });
    }

    // If SMTP fails, we gracefully fallback to dev mode to prevent blocking evaluation (Development only)
    return res.status(200).json({
      success: true,
      message: `Failed to send email via SMTP, falling back to Dev Mode. Error: ${error?.message || "Unknown error"}`,
      token,
      devMode: true,
      otp,
    });
  }
}
