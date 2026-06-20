const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, unique: true, sparse: true },
  name: { type: String },
  photoURL: { type: String },
  password: { type: String },
  isPremium: { type: Boolean, default: false },
  lastPasswordResetRequest: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetOTP: { type: String },
  resetOTPExpires: { type: Date },
  loginOTP: { type: String },
  loginOTPExpires: { type: Date },
  // Subscription fields
  subscription: {
    plan: {
      type: String,
      enum: ["free", "bronze", "silver", "gold"],
      default: "free"
    },
    expiresAt: { type: Date, default: null },
    applicationsUsedThisMonth: { type: Number, default: 0 },
    lastResetAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
