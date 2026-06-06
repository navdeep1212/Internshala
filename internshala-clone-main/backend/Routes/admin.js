const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../Model/User");
const Resume = require("../Model/Resume");
const Payment = require("../Model/Payment");
const OTPVerification = require("../Model/OTPVerification");

const adminuser = "admin";
const adminpass = "admin";

// Admin Login
router.post("/adminlogin", (req, res) => {
  const { username, password } = req.body;
  if (username === adminuser && password === adminpass) {
    res.send("admin is here");
  } else {
    res.status(401).send("unauthorized");
  }
});

// Admin Stats
router.get("/stats", async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (!isDbConnected) {
      // Return mock stats in sandbox/offline mode
      return res.json({
        totalResumes: 12,
        revenueGenerated: 600,
        activePremiumUsers: 8,
        successfulPayments: 12,
        failedPayments: 3
      });
    }

    const totalResumes = await Resume.countDocuments({ pdfUrl: { $exists: true, $ne: null } });
    const activePremiumUsers = await User.countDocuments({ isPremium: true });
    const successfulPayments = await Payment.countDocuments({ status: "successful" });
    const failedPayments = await Payment.countDocuments({ status: "failed" });

    // Aggregate total revenue
    const revenueResult = await Payment.aggregate([
      { $match: { status: "successful" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const revenueGenerated = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      totalResumes,
      revenueGenerated,
      activePremiumUsers,
      successfulPayments,
      failedPayments
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Payments List
router.get("/payments", async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (!isDbConnected) {
      // Mock payment details
      return res.json([
        {
          _id: "pay_1",
          razorpay_order_id: "order_mock101",
          razorpay_payment_id: "pay_mock101",
          user_id: "user_mock1",
          verified_email: "chaurasianavdeep2004@gmail.com",
          amount: 50,
          status: "successful",
          created_at: new Date(Date.now() - 100000)
        },
        {
          _id: "pay_2",
          razorpay_order_id: "order_mock102",
          razorpay_payment_id: "pay_mock102",
          user_id: "user_mock2",
          verified_email: "student2@gmail.com",
          amount: 50,
          status: "successful",
          created_at: new Date(Date.now() - 500000)
        },
        {
          _id: "pay_3",
          razorpay_order_id: "order_mock103",
          razorpay_payment_id: null,
          user_id: "user_mock3",
          verified_email: "student3@gmail.com",
          amount: 50,
          status: "failed",
          created_at: new Date(Date.now() - 1000000)
        }
      ]);
    }

    const payments = await Payment.find().sort({ created_at: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Admin payments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin OTP Logs List
router.get("/otp-logs", async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (!isDbConnected) {
      // Mock OTP request logs
      return res.json([
        {
          _id: "otp_1",
          email: "chaurasianavdeep2004@gmail.com",
          otp: "sha256_mock_hash_1",
          attempts: 1,
          verified: true,
          lastSentAt: new Date(Date.now() - 150000)
        },
        {
          _id: "otp_2",
          email: "evaluator@internshala.com",
          otp: "sha256_mock_hash_2",
          attempts: 2,
          verified: false,
          lastSentAt: new Date(Date.now() - 300000)
        }
      ]);
    }

    const logs = await OTPVerification.find().sort({ lastSentAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Admin OTP logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin Resumes List with Search by Student Name/Email
router.get("/resumes", async (req, res) => {
  const { search } = req.query;
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (!isDbConnected) {
      const mockResumes = [
        {
          _id: "res_mock_1",
          user_id: "user_mock1",
          personalInfo: {
            fullName: "Navdeep Chaurasia",
            email: "chaurasianavdeep2004@gmail.com",
            phone: "+91 9876543210",
            address: "Mumbai, India"
          },
          templateUsed: "Template 1",
          pdfUrl: "/api/resume/download/res_mock_1",
          createdAt: new Date()
        },
        {
          _id: "res_mock_2",
          user_id: "user_mock2",
          personalInfo: {
            fullName: "Rahul Kumar",
            email: "student2@gmail.com",
            phone: "+91 9999999999",
            address: "Delhi, India"
          },
          templateUsed: "Template 2",
          pdfUrl: "/api/resume/download/res_mock_2",
          createdAt: new Date(Date.now() - 400000)
        }
      ];

      if (search) {
        const query = search.toLowerCase();
        return res.json(
          mockResumes.filter(
            (r) =>
              r.personalInfo.fullName.toLowerCase().includes(query) ||
              r.personalInfo.email.toLowerCase().includes(query)
          )
        );
      }
      return res.json(mockResumes);
    }

    let query = { pdfUrl: { $exists: true, $ne: null } };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query["$or"] = [
        { "personalInfo.fullName": searchRegex },
        { "personalInfo.email": searchRegex }
      ];
    }

    const resumes = await Resume.find(query).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    console.error("Admin resumes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
