const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  payment_id: { type: String }, // Razorpay Payment ID after verification
  user_id: { type: String, required: true }, // Firebase uid
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  amount: { type: Number, required: true, default: 50 }, // ₹50
  status: { type: String, enum: ["created", "successful", "failed"], default: "created" },
  verified_email: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Payment", PaymentSchema);
