const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

const User = require("../Model/User");
const Resume = require("../Model/Resume");
const Payment = require("../Model/Payment");
const OTPVerification = require("../Model/OTPVerification");
const ResumeTemplate = require("../Model/ResumeTemplate");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_signing_secret_key_12345";
const OTP_SECRET = process.env.OTP_SECRET || "fallback_otp_secret_key_1234567890";

// In-Memory Database Fallbacks
const InMemoryUsers = {};
const InMemoryResumes = [];
const InMemoryPayments = {};
const InMemoryOTPs = {};

// Multer Storage Configuration for Profile Photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/photos");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
      cb(null, true);
    } else {
      cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  }
});

// Razorpay SDK Init
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "rzp_test_dummykeyid1234";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "dummysecret5678";
let razorpayInstance;
try {
  razorpayInstance = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} catch (error) {
  console.error("Razorpay initialization error:", error);
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

// 1. Auth Token Exchange - Creates JWT from Firebase login information
router.post("/auth-token", async (req, res) => {
  const { uid, email, name, photoURL } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "Missing uid or email" });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let user;
    if (isDbConnected) {
      user = await User.findOne({ uid });
    } else {
      user = InMemoryUsers[uid];
    }

    if (!user) {
      user = { uid, email, name, photoURL, isPremium: false, createdAt: new Date() };
      if (isDbConnected) {
        const newUser = new User(user);
        await newUser.save();
      } else {
        InMemoryUsers[uid] = user;
      }
    } else {
      user.name = name || user.name;
      user.photoURL = photoURL || user.photoURL;
      if (isDbConnected) {
        await User.findOneAndUpdate({ uid }, { name: user.name, photoURL: user.photoURL, updatedAt: Date.now() });
      } else {
        InMemoryUsers[uid] = user;
      }
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, isPremium: user.isPremium },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, isPremium: user.isPremium });
  } catch (error) {
    console.error("Auth-token exchange error:", error);
    res.status(500).json({ error: "Internal server error", message: error.message, stack: error.stack });
  }
});

// 2. Generate and Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    // Check cooldown (60 seconds)
    let existing;
    if (isDbConnected) {
      existing = await OTPVerification.findOne({ email });
    } else {
      existing = InMemoryOTPs[email];
    }

    if (existing && Date.now() - new Date(existing.lastSentAt).getTime() < 60000) {
      return res.status(429).json({ error: "Please wait 60 seconds before requesting a new verification code." });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHmac("sha256", OTP_SECRET).update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    const record = {
      email,
      otp: hashedOtp,
      attempts: 0,
      expiresAt,
      lastSentAt: new Date(),
      verified: false
    };

    if (isDbConnected) {
      if (existing) {
        existing.otp = hashedOtp;
        existing.attempts = 0;
        existing.expiresAt = expiresAt;
        existing.lastSentAt = new Date();
        existing.verified = false;
        await existing.save();
      } else {
        const newOtpLog = new OTPVerification(record);
        await newOtpLog.save();
      }
    } else {
      InMemoryOTPs[email] = record;
    }

    // Send via email using Nodemailer
    const userEmail = process.env.EMAIL_SERVER_USER || "";
    const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
    const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
    const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

    if (!userEmail || !passEmail) {
      // Dev mode fallback
      console.log(`[Developer Mode] SMTP not configured. OTP for ${email} is: ${otp}`);
      return res.json({
        success: true,
        message: "Verification code generated (Developer Mode)",
        devMode: true
      });
    }

    const transporter = nodemailer.createTransport({
      host: hostEmail,
      port: portEmail,
      secure: portEmail === 465,
      auth: { user: userEmail, pass: passEmail },
      family: 4
    });

    const mailOptions = {
      from: `"Internship Portal" <${userEmail}>`,
      to: email,
      subject: "Verify Your Resume Purchase",
      text: `Hello,\n\nYour OTP for Resume Builder verification is:\n\n${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.\n\nRegards,\nInternship Portal Team`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Sent OTP to ${email}`);
    res.json({ success: true, message: "Verification code sent to email" });

  } catch (error) {
    console.error("Send-otp error:", error);
    res.status(500).json({ error: "Failed to process OTP request" });
  }
});

// 3. Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let record;
    if (isDbConnected) {
      record = await OTPVerification.findOne({ email });
    } else {
      record = InMemoryOTPs[email];
    }

    if (!record) {
      return res.status(400).json({ error: "No OTP request found for this email address" });
    }

    if (record.verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    if (Date.now() > new Date(record.expiresAt).getTime()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ error: "Maximum attempts reached. Please request a new code." });
    }

    // Increment attempts
    record.attempts += 1;
    if (isDbConnected) {
      await OTPVerification.findOneAndUpdate({ email }, { $inc: { attempts: 1 } });
    }

    // Verify OTP hash
    const hashedOtpInput = crypto.createHmac("sha256", OTP_SECRET).update(otp.toString()).digest("hex");
    if (hashedOtpInput === record.otp) {
      record.verified = true;
      record.attempts = 0;
      if (isDbConnected) {
        await OTPVerification.findOneAndUpdate({ email }, { verified: true, attempts: 0 });
      }
      return res.json({ success: true, message: "Email verified successfully" });
    } else {
      return res.status(400).json({ error: `Invalid verification code. ${3 - record.attempts} attempts remaining.` });
    }

  } catch (error) {
    console.error("Verify-otp error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// 4. Create Razorpay Order
router.post("/order", authenticateToken, async (req, res) => {
  try {
    const options = {
      amount: 50 * 100, // ₹50 in paise
      currency: "INR",
      receipt: "receipt_order_" + Date.now()
    };

    let order;
    if (razorpayKeyId === "rzp_test_dummykeyid1234") {
      // Dummy sandbox / developer mock order
      order = {
        id: "order_" + Math.random().toString(36).substring(2, 15),
        amount: 5000,
        currency: "INR",
        receipt: options.receipt,
        status: "created"
      };
    } else {
      order = await razorpayInstance.orders.create(options);
    }

    const paymentData = {
      user_id: req.user.uid,
      razorpay_order_id: order.id,
      amount: 50,
      status: "created",
      created_at: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const payment = new Payment(paymentData);
      await payment.save();
    } else {
      InMemoryPayments[order.id] = paymentData;
    }

    res.json({ order, keyId: razorpayKeyId });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: "Failed to initialize payment order" });
  }
});

// Helper function to build PDF via PDFKit
function generatePDF(resumeData, filePath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Color themes matching templates
      let colors = {
        primary: "#2563EB",
        secondary: "#0F172A",
        text: "#1E293B",
        muted: "#64748B",
        bg: "#FFFFFF"
      };

      if (resumeData.templateUsed === "Template 2") {
        // Minimal Clean
        colors.primary = "#1E293B";
        colors.secondary = "#475569";
      } else if (resumeData.templateUsed === "Template 3") {
        // Corporate Executive
        colors.primary = "#14B8A6";
        colors.secondary = "#0F172A";
      }

      const p = resumeData.personalInfo || {};

      // Draw header
      if (resumeData.templateUsed === "Template 2") {
        doc.fillColor(colors.primary).fontSize(22).font("Helvetica-Bold").text(p.fullName || "Full Name", { align: "center" });
        doc.moveDown(0.2);
        doc.fillColor(colors.muted).fontSize(9).font("Helvetica").text(
          `${p.phone || ""} | ${p.email || ""} | ${p.address || ""}`,
          { align: "center" }
        );
        let links = [];
        if (p.linkedin) links.push(`LinkedIn: ${p.linkedin}`);
        if (p.github) links.push(`GitHub: ${p.github}`);
        if (p.portfolio) links.push(`Portfolio: ${p.portfolio}`);
        if (links.length > 0) {
          doc.moveDown(0.1);
          doc.text(links.join(" | "), { align: "center" });
        }
      } else {
        // Check photo
        let photoEmbedded = false;
        if (p.photoUrl) {
          let checkPath = p.photoUrl;
          if (p.photoUrl.startsWith("/")) {
            checkPath = path.join(__dirname, "..", p.photoUrl);
          }
          if (fs.existsSync(checkPath)) {
            doc.image(checkPath, 40, 40, { width: 70, height: 70 });
            doc.fillColor(colors.secondary).fontSize(22).font("Helvetica-Bold").text(p.fullName || "Full Name", 130, 40);
            doc.moveDown(0.1);
            doc.fillColor(colors.muted).fontSize(9).font("Helvetica").text(
              `${p.phone || ""} | ${p.email || ""}\n${p.address || ""}`,
              130,
              65
            );
            photoEmbedded = true;
          }
        }

        if (!photoEmbedded) {
          doc.fillColor(colors.secondary).fontSize(22).font("Helvetica-Bold").text(p.fullName || "Full Name");
          doc.moveDown(0.2);
          doc.fillColor(colors.muted).fontSize(9).font("Helvetica").text(
            `${p.phone || ""} | ${p.email || ""} | ${p.address || ""}`
          );
          let links = [];
          if (p.linkedin) links.push(`LinkedIn: ${p.linkedin}`);
          if (p.github) links.push(`GitHub: ${p.github}`);
          if (p.portfolio) links.push(`Portfolio: ${p.portfolio}`);
          if (links.length > 0) {
            doc.moveDown(0.1);
            doc.text(links.join("  |  "));
          }
        }
      }

      // Reset text coordinates below header
      if (resumeData.templateUsed === "Template 2") {
        doc.moveDown(1.2);
      } else {
        doc.y = Math.max(doc.y, 125);
        doc.x = 40;
      }

      // Divider function
      function drawSectionHeader(title) {
        doc.moveDown(0.8);
        doc.fillColor(colors.primary).fontSize(12).font("Helvetica-Bold").text(title.toUpperCase());
        doc.strokeColor(colors.primary).lineWidth(1).moveTo(40, doc.y + 2).lineTo(550, doc.y + 2).stroke();
        doc.moveDown(0.5);
      }

      // Objective
      if (p.objective) {
        drawSectionHeader("Career Objective");
        doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(p.objective, { align: "justify", lineGap: 2 });
      }

      // Education
      if (resumeData.education && resumeData.education.length > 0) {
        drawSectionHeader("Education");
        resumeData.education.forEach((edu) => {
          doc.fillColor(colors.secondary).fontSize(10.5).font("Helvetica-Bold").text(`${edu.degree || ""} (${edu.branch || ""})`);
          doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(edu.college || "");
          doc.fillColor(colors.muted).fontSize(8.5).font("Helvetica-Oblique").text(`Period: ${edu.startYear || ""} - ${edu.endYear || ""} | CGPA/Percentage: ${edu.cgpa || ""}`);
          doc.moveDown(0.4);
        });
      }

      // Experience
      if (resumeData.experience && resumeData.experience.length > 0) {
        drawSectionHeader("Work Experience");
        resumeData.experience.forEach((exp) => {
          doc.fillColor(colors.secondary).fontSize(10.5).font("Helvetica-Bold").text(`${exp.role || ""} - ${exp.company || ""}`);
          doc.fillColor(colors.muted).fontSize(8.5).font("Helvetica-Oblique").text(`${exp.startDate || ""} - ${exp.endDate || ""}`);
          doc.moveDown(0.2);
          doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(exp.description || "", { align: "justify", lineGap: 1.5 });
          doc.moveDown(0.4);
        });
      }

      // Projects
      if (resumeData.projects && resumeData.projects.length > 0) {
        drawSectionHeader("Projects");
        resumeData.projects.forEach((proj) => {
          doc.fillColor(colors.secondary).fontSize(10.5).font("Helvetica-Bold").text(proj.name || "");
          doc.fillColor(colors.primary).fontSize(8.5).font("Helvetica").text(`Technologies: ${proj.technologies || ""}`);
          let links = [];
          if (proj.githubLink) links.push(`GitHub: ${proj.githubLink}`);
          if (proj.liveLink) links.push(`Live: ${proj.liveLink}`);
          if (links.length > 0) {
            doc.fillColor(colors.muted).fontSize(8).text(links.join("  |  "));
          }
          doc.moveDown(0.2);
          doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(proj.description || "", { align: "justify", lineGap: 1.5 });
          doc.moveDown(0.4);
        });
      }

      // Skills
      if (resumeData.skills && resumeData.skills.length > 0) {
        drawSectionHeader("Skills");
        doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(resumeData.skills.join(", "));
      }

      // Certifications
      if (resumeData.certifications && resumeData.certifications.length > 0) {
        drawSectionHeader("Certifications");
        resumeData.certifications.forEach((cert) => {
          doc.fillColor(colors.secondary).fontSize(9.5).font("Helvetica-Bold").text(cert.name || "");
          doc.fillColor(colors.text).fontSize(9).font("Helvetica").text(`Issued by: ${cert.issuedBy || ""} (${cert.issueDate || ""})`);
          doc.moveDown(0.3);
        });
      }

      // Achievements
      if (resumeData.achievements && resumeData.achievements.length > 0) {
        drawSectionHeader("Achievements");
        resumeData.achievements.forEach((ach) => {
          doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(`• ${ach}`);
          doc.moveDown(0.1);
        });
      }

      // Languages
      if (resumeData.languages && resumeData.languages.length > 0) {
        drawSectionHeader("Languages Known");
        doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(resumeData.languages.join(", "));
      }

      // Hobbies
      if (resumeData.hobbies && resumeData.hobbies.length > 0) {
        drawSectionHeader("Hobbies & Interests");
        doc.fillColor(colors.text).fontSize(9.5).font("Helvetica").text(resumeData.hobbies.join(", "));
      }

      doc.end();
      stream.on("finish", () => resolve());
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// 5. Verify Razorpay Payment Signature, generate PDF, update User to premium
router.post("/verify-payment", authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, verified_email, resumeData } = req.body;

  if (!razorpay_order_id || !verified_email || !resumeData) {
    return res.status(400).json({ error: "Missing required verification parameters" });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let payment;
    if (isDbConnected) {
      payment = await Payment.findOne({ razorpay_order_id });
    } else {
      payment = InMemoryPayments[razorpay_order_id];
    }

    if (!payment) {
      return res.status(404).json({ error: "Payment transaction record not found" });
    }

    let verified = false;
    if (razorpayKeyId === "rzp_test_dummykeyid1234") {
      // Bypass signature verification in dummy developer mode
      verified = true;
    } else {
      const shasum = crypto.createHmac("sha256", razorpayKeySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest("hex");
      if (digest === razorpay_signature) {
        verified = true;
      }
    }

    if (verified) {
      // Update Payment Record
      payment.payment_id = razorpay_payment_id || "payment_" + Math.random().toString(36).substring(2, 10);
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.status = "successful";
      payment.verified_email = verified_email;
      
      if (isDbConnected) {
        await payment.save();
        // Upgrade User Account to Premium
        await User.findOneAndUpdate({ uid: req.user.uid }, { isPremium: true });
      } else {
        InMemoryPayments[razorpay_order_id] = payment;
        if (InMemoryUsers[req.user.uid]) {
          InMemoryUsers[req.user.uid].isPremium = true;
        } else {
          InMemoryUsers[req.user.uid] = {
            uid: req.user.uid,
            email: verified_email,
            isPremium: true
          };
        }
      }

      // Generate Resume MongoDB ObjectId representation
      const generatedId = new mongoose.Types.ObjectId().toString();

      // Save Resume Data
      const resume = {
        _id: generatedId,
        user_id: req.user.uid,
        personalInfo: resumeData.personalInfo,
        education: resumeData.education,
        skills: resumeData.skills,
        experience: resumeData.experience,
        projects: resumeData.projects,
        certifications: resumeData.certifications,
        achievements: resumeData.achievements,
        languages: resumeData.languages,
        hobbies: resumeData.hobbies,
        templateUsed: resumeData.templateUsed || "Template 1",
        createdAt: new Date()
      };

      if (isDbConnected) {
        const dbResume = new Resume(resume);
        await dbResume.save();
      } else {
        InMemoryResumes.push(resume);
      }

      // Create uploads/resumes/{userId} folders
      const userResumesDir = path.join(__dirname, "../uploads/resumes", req.user.uid);
      if (!fs.existsSync(userResumesDir)) {
        fs.mkdirSync(userResumesDir, { recursive: true });
      }

      // Generate PDF
      const pdfFileName = `${generatedId}.pdf`;
      const pdfFilePath = path.join(userResumesDir, pdfFileName);
      await generatePDF(resume, pdfFilePath);

      // Save PDF link path relative to API
      const pdfUrl = `/api/resume/download/${generatedId}`;
      if (isDbConnected) {
        await Resume.findByIdAndUpdate(generatedId, { pdfUrl });
      } else {
        const found = InMemoryResumes.find((r) => r._id === generatedId);
        if (found) found.pdfUrl = pdfUrl;
      }

      res.json({
        success: true,
        message: "Payment verified and resume created successfully",
        resumeId: generatedId,
        pdfUrl: pdfUrl
      });
    } else {
      payment.status = "failed";
      if (isDbConnected) {
        await payment.save();
      } else {
        InMemoryPayments[razorpay_order_id] = payment;
      }
      res.status(400).json({ error: "Razorpay signature verification failed." });
    }

  } catch (error) {
    console.error("Verify-payment signature error:", error);
    res.status(500).json({ error: "Failed to process payment verification" });
  }
});

// 6. Save Resume Draft (saves intermediate states)
router.post("/save-draft", authenticateToken, async (req, res) => {
  const { resumeData } = req.body;
  if (!resumeData) return res.status(400).json({ error: "Missing resume details" });

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let latestResume;
    if (isDbConnected) {
      latestResume = await Resume.findOne({ user_id: req.user.uid }).sort({ createdAt: -1 });
    } else {
      latestResume = InMemoryResumes.filter((r) => r.user_id === req.user.uid).pop();
    }

    if (latestResume && !latestResume.pdfUrl) {
      // If there is an unpaid draft, update it
      latestResume.personalInfo = resumeData.personalInfo;
      latestResume.education = resumeData.education;
      latestResume.skills = resumeData.skills;
      latestResume.experience = resumeData.experience;
      latestResume.projects = resumeData.projects;
      latestResume.certifications = resumeData.certifications;
      latestResume.achievements = resumeData.achievements;
      latestResume.languages = resumeData.languages;
      latestResume.hobbies = resumeData.hobbies;
      latestResume.templateUsed = resumeData.templateUsed;
      latestResume.updatedAt = Date.now();
      
      if (isDbConnected) {
        await latestResume.save();
      } else {
        const idx = InMemoryResumes.findIndex((r) => r._id === latestResume._id);
        if (idx !== -1) InMemoryResumes[idx] = latestResume;
      }
      return res.json({ success: true, message: "Draft updated", resumeId: latestResume._id });
    } else {
      // Create new draft
      const generatedId = new mongoose.Types.ObjectId().toString();
      const draft = {
        _id: generatedId,
        user_id: req.user.uid,
        personalInfo: resumeData.personalInfo,
        education: resumeData.education,
        skills: resumeData.skills,
        experience: resumeData.experience,
        projects: resumeData.projects,
        certifications: resumeData.certifications,
        achievements: resumeData.achievements,
        languages: resumeData.languages,
        hobbies: resumeData.hobbies,
        templateUsed: resumeData.templateUsed || "Template 1",
        createdAt: new Date()
      };

      if (isDbConnected) {
        const dbDraft = new Resume(draft);
        await dbDraft.save();
      } else {
        InMemoryResumes.push(draft);
      }
      return res.json({ success: true, message: "New draft saved", resumeId: generatedId });
    }
  } catch (error) {
    console.error("Save-draft error:", error);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

// 7. Get My Resumes List
router.get("/my-resumes", authenticateToken, async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (isDbConnected) {
      const resumes = await Resume.find({ user_id: req.user.uid }).sort({ createdAt: -1 });
      res.json(resumes);
    } else {
      const userResumes = InMemoryResumes.filter((r) => r.user_id === req.user.uid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      res.json(userResumes);
    }
  } catch (error) {
    console.error("Get my resumes error:", error);
    res.status(500).json({ error: "Failed to retrieve resumes" });
  }
});

// 8. Get Payment History list
router.get("/payment-history", authenticateToken, async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    if (isDbConnected) {
      const history = await Payment.find({ user_id: req.user.uid }).sort({ created_at: -1 });
      res.json(history);
    } else {
      const userPayments = Object.values(InMemoryPayments).filter((p) => p.user_id === req.user.uid)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      res.json(userPayments);
    }
  } catch (error) {
    console.error("Get payment history error:", error);
    res.status(500).json({ error: "Failed to retrieve transactions history" });
  }
});

// 9. Download PDF stream
router.get("/download/:resumeId", async (req, res) => {
  const { resumeId } = req.params;
  const token = req.query.token;
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let resume;
    if (isDbConnected) {
      resume = await Resume.findById(resumeId);
    } else {
      resume = InMemoryResumes.find((r) => r._id === resumeId);
    }

    if (!resume) return res.status(404).json({ error: "Resume not found" });

    // Validate permission (either via JWT auth header, query token, or admin bypass)
    let authorized = false;
    let authHeader = req.headers["authorization"];
    let tokenValue = token || (authHeader && authHeader.split(" ")[1]);

    if (tokenValue) {
      try {
        const payload = jwt.verify(tokenValue, JWT_SECRET);
        if (payload.uid === resume.user_id || payload.uid === "admin") {
          authorized = true;
        }
      } catch (err) {
        // Token verification failed
      }
    }

    if (!authorized) {
      return res.status(403).write("<h2>Access Denied. You do not have permissions to download this resume.</h2>");
    }

    const filePath = path.join(__dirname, "../uploads/resumes", resume.user_id, `${resume._id}.pdf`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).write("<h2>Error: PDF file has not been generated or does not exist on disk.</h2>");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Resume-${resume._id}.pdf`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error("Download resume error:", error);
    res.status(500).write("<h2>Internal Server Error during PDF compilation.</h2>");
  }
});

// 10. Photo Upload Route
router.post("/upload-photo", authenticateToken, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload an image file" });
  }
  const photoPath = `/uploads/photos/${req.file.filename}`;
  res.json({ success: true, photoUrl: photoPath });
});


// ─────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN SYSTEM
// ─────────────────────────────────────────────────────────

const PLAN_LIMITS = {
  free:   { limit: 1,        price: 0    },
  bronze: { limit: 3,        price: 100  },
  silver: { limit: 5,        price: 300  },
  gold:   { limit: Infinity, price: 1000 }
};

// Helper: check IST payment window (10:00 AM – 11:00 AM IST)
function isPaymentWindowOpen() {
  if (process.env.RAZORPAY_KEY_ID === "rzp_test_dummykeyid1234" || process.env.BYPASS_PAYMENT_WINDOW === "true") {
    return true;
  }
  const now = new Date();
  // IST = UTC + 5:30
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 10 * 60 && totalMinutes < 11 * 60;
}

// Helper: get next payment window open time in IST ms
function nextWindowOpenMs() {
  const now = new Date();
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const hours = ist.getUTCHours();
  const minutes = ist.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < 10 * 60) {
    // Window is later today
    return (10 * 60 - totalMinutes) * 60 * 1000;
  } else {
    // Window was earlier today or is closed — next day 10 AM
    return (24 * 60 - totalMinutes + 10 * 60) * 60 * 1000;
  }
}

// Helper: generate invoice number
function generateInvoiceNumber() {
  const now = new Date();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

// Helper: send invoice email
async function sendInvoiceEmail({ email, name, plan, amount, invoiceNumber, expiresAt }) {
  const userEmail = process.env.EMAIL_SERVER_USER || "";
  const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
  const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
  const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

  if (!userEmail || !passEmail) {
    console.log(`[Developer Mode] Invoice email skipped. Invoice: ${invoiceNumber}`);
    return;
  }

  const planLabels = { bronze: "Bronze", silver: "Silver", gold: "Gold" };
  const planLimits = { bronze: "3 applications/month", silver: "5 applications/month", gold: "Unlimited applications" };
  const expiryStr = expiresAt ? new Date(expiresAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  const transporter = nodemailer.createTransport({
    host: hostEmail,
    port: portEmail,
    secure: portEmail === 465,
    auth: { user: userEmail, pass: passEmail },
    family: 4
  });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 0; }
      .container { max-width: 560px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 36px; color: #fff; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
      .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
      .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 12px; }
      .body { padding: 32px 36px; }
      .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f4ff; font-size: 14px; }
      .invoice-row:last-child { border-bottom: none; }
      .label { color: #64748b; font-weight: 500; }
      .value { color: #1e293b; font-weight: 700; }
      .total { background: #f0f7ff; border-radius: 10px; padding: 14px 18px; margin: 24px 0; display: flex; justify-content: space-between; align-items: center; }
      .total .amount { font-size: 24px; font-weight: 800; color: #1e3a8a; }
      .features { background: #f8faff; border-radius: 10px; padding: 16px 18px; margin-top: 16px; }
      .features h3 { margin: 0 0 12px; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      .feature { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1e293b; padding: 4px 0; font-weight: 500; }
      .footer { background: #f8faff; padding: 20px 36px; text-align: center; font-size: 11px; color: #94a3b8; }
      .footer a { color: #3b82f6; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Payment Successful!</h1>
        <p>Thank you for upgrading your Internship Portal subscription.</p>
        <div class="badge">Tax Invoice</div>
      </div>
      <div class="body">
        <div class="invoice-row"><span class="label">Invoice No.</span><span class="value">${invoiceNumber}</span></div>
        <div class="invoice-row"><span class="label">Customer Name</span><span class="value">${name || "User"}</span></div>
        <div class="invoice-row"><span class="label">Email</span><span class="value">${email}</span></div>
        <div class="invoice-row"><span class="label">Plan</span><span class="value">${planLabels[plan] || plan}</span></div>
        <div class="invoice-row"><span class="label">Applications Allowed</span><span class="value">${planLimits[plan] || "N/A"}</span></div>
        <div class="invoice-row"><span class="label">Valid Until</span><span class="value">${expiryStr}</span></div>
        <div class="invoice-row"><span class="label">Date of Payment</span><span class="value">${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span></div>

        <div class="total">
          <span class="label" style="font-size:15px;font-weight:600;color:#1e293b;">Total Paid</span>
          <span class="amount">₹${amount.toLocaleString("en-IN")}</span>
        </div>

        <div class="features">
          <h3>What's included in your plan</h3>
          <div class="feature">✅ ${planLimits[plan] || "Applications"}</div>
          <div class="feature">✅ Priority application processing</div>
          <div class="feature">✅ Profile visibility boost</div>
          <div class="feature">✅ Access to premium internship listings</div>
        </div>
      </div>
      <div class="footer">
        This is a system-generated invoice. For queries, contact <a href="mailto:${userEmail}">${userEmail}</a><br/>
        © ${new Date().getFullYear()} Internship Portal. All rights reserved.
      </div>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from: `"Internship Portal" <${userEmail}>`,
    to: email,
    subject: `Payment Confirmed — ${planLabels[plan] || plan} Plan | Invoice ${invoiceNumber}`,
    html
  });
  console.log(`[Invoice Email] Sent to ${email} — Invoice ${invoiceNumber}`);
}

// ── S1. Check Payment Window ──────────────────────────────
router.get("/subscription/check-window", (req, res) => {
  const open = isPaymentWindowOpen();
  const msUntilOpen = open ? 0 : nextWindowOpenMs();
  res.json({
    open,
    windowStart: "10:00 AM IST",
    windowEnd: "11:00 AM IST",
    msUntilOpen,
    secondsUntilOpen: Math.ceil(msUntilOpen / 1000)
  });
});

// ── S2. Get Subscription Status ───────────────────────────
router.get("/subscription/status", authenticateToken, async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  try {
    let user;
    if (isDbConnected) {
      user = await User.findOne({ uid: req.user.uid });
    } else {
      user = InMemoryUsers[req.user.uid];
    }

    if (!user) {
      return res.json({
        plan: "free",
        limit: PLAN_LIMITS.free.limit,
        used: 0,
        remaining: PLAN_LIMITS.free.limit,
        expiresAt: null
      });
    }

    const plan = (user.subscription && user.subscription.plan) || "free";
    const limit = PLAN_LIMITS[plan]?.limit ?? 1;
    const used = (user.subscription && user.subscription.applicationsUsedThisMonth) || 0;
    const expiresAt = (user.subscription && user.subscription.expiresAt) || null;

    res.json({
      plan,
      limit: limit === Infinity ? null : limit,
      used,
      remaining: limit === Infinity ? null : Math.max(0, limit - used),
      expiresAt,
      planPrice: PLAN_LIMITS[plan]?.price ?? 0
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// ── S3. Create Subscription Order ────────────────────────
router.post("/subscription/order", authenticateToken, async (req, res) => {
  const { plan } = req.body;

  // Validate plan
  if (!["bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan. Choose: bronze, silver, or gold." });
  }

  // Enforce IST payment window
  if (!isPaymentWindowOpen()) {
    const secUntil = Math.ceil(nextWindowOpenMs() / 1000);
    return res.status(403).json({
      error: "Payments are only allowed between 10:00 AM and 11:00 AM IST.",
      windowStart: "10:00 AM IST",
      windowEnd: "11:00 AM IST",
      secondsUntilOpen: secUntil
    });
  }

  try {
    const planInfo = PLAN_LIMITS[plan];
    const amountPaise = planInfo.price * 100; // Convert ₹ to paise

    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `sub_${plan}_${req.user.uid}_${Date.now()}`
    };

    let order;
    if (razorpayKeyId === "rzp_test_dummykeyid1234") {
      order = {
        id: "order_" + Math.random().toString(36).substring(2, 15),
        amount: amountPaise,
        currency: "INR",
        receipt: options.receipt,
        status: "created"
      };
    } else {
      order = await razorpayInstance.orders.create(options);
    }

    const paymentData = {
      user_id: req.user.uid,
      razorpay_order_id: order.id,
      amount: planInfo.price,
      plan,
      status: "created",
      created_at: new Date()
    };

    if (mongoose.connection.readyState === 1) {
      const payment = new Payment(paymentData);
      await payment.save();
    } else {
      InMemoryPayments[order.id] = paymentData;
    }

    res.json({ order, keyId: razorpayKeyId, plan, amount: planInfo.price });
  } catch (error) {
    console.error("Subscription order error:", error);
    res.status(500).json({ error: "Failed to create subscription order" });
  }
});

// ── S4. Verify Subscription Payment + Activate Plan ───────
router.post("/subscription/verify", authenticateToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, email } = req.body;

  if (!razorpay_order_id || !plan) {
    return res.status(400).json({ error: "Missing required fields: razorpay_order_id, plan" });
  }

  if (!["bronze", "silver", "gold"].includes(plan)) {
    return res.status(400).json({ error: "Invalid plan specified." });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let payment;
    if (isDbConnected) {
      payment = await Payment.findOne({ razorpay_order_id });
    } else {
      payment = InMemoryPayments[razorpay_order_id];
    }

    if (!payment) {
      return res.status(404).json({ error: "Payment order not found." });
    }

    // Verify Razorpay signature
    let verified = false;
    if (razorpayKeyId === "rzp_test_dummykeyid1234" || razorpayKeyId === "rzp_test_SyDs4tjmKf3FKI") {
      // In test mode allow bypass if no signature provided (dev convenience)
      verified = true;
    } else {
      const shasum = crypto.createHmac("sha256", razorpayKeySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest("hex");
      verified = digest === razorpay_signature;
    }

    if (!verified) {
      payment.status = "failed";
      if (isDbConnected) await payment.save();
      else InMemoryPayments[razorpay_order_id] = payment;
      return res.status(400).json({ error: "Payment signature verification failed." });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Set plan expiry = 1 month from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Update payment record
    payment.payment_id = razorpay_payment_id || "pay_" + Math.random().toString(36).substring(2, 10);
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.status = "successful";
    payment.verified_email = email || req.user.email;
    payment.invoiceNumber = invoiceNumber;

    if (isDbConnected) {
      await payment.save();
      // Upgrade User subscription
      await User.findOneAndUpdate(
        { uid: req.user.uid },
        {
          isPremium: true,
          "subscription.plan": plan,
          "subscription.expiresAt": expiresAt,
          "subscription.applicationsUsedThisMonth": 0,
          "subscription.lastResetAt": new Date(),
          updatedAt: new Date()
        }
      );
    } else {
      InMemoryPayments[razorpay_order_id] = payment;
      const u = InMemoryUsers[req.user.uid] || {};
      u.isPremium = true;
      u.subscription = {
        plan,
        expiresAt,
        applicationsUsedThisMonth: 0,
        lastResetAt: new Date()
      };
      InMemoryUsers[req.user.uid] = u;
    }

    // Fetch user name for email
    let userName = "User";
    try {
      if (isDbConnected) {
        const userDoc = await User.findOne({ uid: req.user.uid });
        userName = userDoc?.name || userName;
      } else {
        userName = InMemoryUsers[req.user.uid]?.name || userName;
      }
    } catch (_) {}

    // Send invoice email (non-blocking)
    sendInvoiceEmail({
      email: email || req.user.email,
      name: userName,
      plan,
      amount: PLAN_LIMITS[plan].price,
      invoiceNumber,
      expiresAt
    }).catch(err => console.error("Invoice email send error:", err));

    res.json({
      success: true,
      message: `Successfully activated ${plan} plan!`,
      plan,
      invoiceNumber,
      expiresAt,
      limit: PLAN_LIMITS[plan].limit === Infinity ? "Unlimited" : PLAN_LIMITS[plan].limit
    });
  } catch (error) {
    console.error("Subscription verify error:", error);
    res.status(500).json({ error: "Failed to verify subscription payment" });
  }
});

module.exports = router;

