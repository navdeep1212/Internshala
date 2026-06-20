const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  email: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  browser: { type: String, required: true },
  os: { type: String, required: true },
  device: { type: String, required: true }, // "desktop", "laptop", or "mobile"
  ipAddress: { type: String, required: true },
  status: { type: String, enum: ["success", "failed", "pending_otp", "blocked"], required: true },
  failureReason: { type: String }
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);
