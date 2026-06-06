const mongoose = require("mongoose");

const OTPVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true }, // Hashed/Encrypted 6-digit OTP
  attempts: { type: Number, default: 0 }, // Max 3 attempts
  expiresAt: { type: Date, required: true }, // 5 minutes limit
  lastSentAt: { type: Date, default: Date.now }, // 60s cooldown limit
  verified: { type: Boolean, default: false }
});

module.exports = mongoose.model("OTPVerification", OTPVerificationSchema);
