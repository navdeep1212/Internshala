import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

type ResponseData = {
  success: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { email, otp, token } = req.body;

  if (!email || !otp || !token) {
    return res.status(400).json({ success: false, message: "Missing required parameters" });
  }

  // 1. Split token to extract hash and expires timestamp
  const parts = token.split(".");
  if (parts.length !== 2) {
    return res.status(400).json({ success: false, message: "Invalid verification token" });
  }

  const [hash, expiresStr] = parts;
  const expires = parseInt(expiresStr);

  // 2. Check if the OTP is expired
  if (Date.now() > expires) {
    return res.status(400).json({ success: false, message: "Verification code expired" });
  }

  // 3. Recompute hash and verify
  const secret = process.env.OTP_SECRET || "fallback_otp_secret_key_1234567890";
  const data = `${email}|${otp}|${expires}`;
  const computedHash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  if (computedHash === hash) {
    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } else {
    return res.status(400).json({ success: false, message: "Invalid verification code" });
  }
}
