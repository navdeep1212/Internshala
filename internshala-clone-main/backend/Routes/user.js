const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const User = require("../Model/User");
const LoginHistory = require("../Model/LoginHistory");

// In-Memory fallback store for sandbox/offline mode
const InMemoryUsers = {};
const InMemoryLoginHistory = [];

/**
 * Helper to parse User-Agent header
 */
function parseUA(userAgent, bodyDevice) {
  const ua = userAgent || "";
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = bodyDevice || "desktop";

  // Browser detection
  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/opr|opera/i.test(ua)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  } else if (/msie|trident/i.test(ua)) {
    browser = "Internet Explorer";
  }

  // OS detection
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
    if (device === "desktop" && !bodyDevice) {
      device = "laptop"; // macOS is predominantly laptop-class
    }
  } else if (/android/i.test(ua)) {
    os = "Android";
    device = "mobile";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
    device = "mobile";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // Force bodyDevice if sent
  if (bodyDevice) {
    device = bodyDevice;
  } else {
    // If not mobile and no bodyDevice, check if user-agent has mobile keywords
    if (/mobi|phone/i.test(ua)) {
      device = "mobile";
    }
  }

  return { browser, os, device };
}

/**
 * Helper to record login history
 */
async function recordLoginHistory({ email, browser, os, device, ipAddress, status, failureReason }) {
  const record = {
    email: email.trim().toLowerCase(),
    timestamp: new Date(),
    browser,
    os,
    device,
    ipAddress,
    status,
    failureReason
  };

  const isDbConnected = mongoose.connection.readyState === 1;
  if (isDbConnected) {
    try {
      const history = new LoginHistory(record);
      await history.save();
    } catch (err) {
      console.error("Failed to save login history to MongoDB:", err);
    }
  } else {
    InMemoryLoginHistory.push(record);
    console.log("[Developer Mode] Recorded Login History in-memory:", record);
  }
}


/**
 * Generate a random password containing ONLY uppercase and lowercase letters.
 * No numbers, no special characters.
 * @param {number} length - Length of the generated password (default 12)
 * @returns {string} The generated password
 */
function generateAlphaPassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const allChars = uppercase + lowercase;

  let password = "";

  // Guarantee at least one uppercase and one lowercase character
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];

  // Fill the remaining characters randomly from all letters
  for (let i = 2; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password so the guaranteed chars aren't always first
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}

/**
 * Hash a password with SHA-256 using the built-in crypto module.
 * Used as a lightweight alternative to bcrypt.
 */
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * POST /api/user/forgot-password
 *
 * Body: { identifier: "<email or phone>" }
 *
 * - Looks up user by email OR phone number.
 * - Enforces once-per-day rate limit on password resets.
 * - Generates a 6-digit numeric verification code (OTP) and sends it via email (or dev mode fallback).
 */
router.post("/forgot-password", async (req, res) => {
  const { identifier } = req.body;

  if (!identifier || typeof identifier !== "string" || identifier.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address or phone number."
    });
  }

  const trimmedIdentifier = identifier.trim();
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let user = null;

    if (isDbConnected) {
      user = await User.findOne({
        $or: [
          { email: trimmedIdentifier },
          { phone: trimmedIdentifier }
        ]
      });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email === trimmedIdentifier || u.phone === trimmedIdentifier
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email or phone number."
      });
    }

    // Rate-limit check: only once per day (24 hours)
    if (user.lastPasswordResetRequest) {
      const lastReset = new Date(user.lastPasswordResetRequest).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - lastReset < twentyFourHours) {
        return res.status(429).json({
          success: false,
          message: "You can use this option only once per day."
        });
      }
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update the user record
    if (isDbConnected) {
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          resetOTP: code,
          resetOTPExpires: expires,
          lastPasswordResetRequest: new Date(),
          updatedAt: new Date()
        }
      );
    } else {
      const key = user.uid || user.email;
      InMemoryUsers[key] = {
        ...user,
        resetOTP: code,
        resetOTPExpires: expires,
        lastPasswordResetRequest: new Date(),
        updatedAt: new Date()
      };
    }

    // Setup nodemailer
    const userEmail = process.env.EMAIL_SERVER_USER || "";
    const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
    const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
    const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

    if (!userEmail || !passEmail) {
      // Dev mode fallback
      console.log(`[Developer Mode] SMTP not configured. Reset OTP code for ${user.email} is: ${code}`);
      return res.json({
        success: true,
        message: "Verification code generated successfully (Developer Mode).",
        devMode: true
      });
    }

    const transporter = nodemailer.createTransport({
      host: hostEmail,
      port: portEmail,
      secure: portEmail === 465,
      auth: { user: userEmail, pass: passEmail }
    });

    const mailOptions = {
      from: `"Internship Portal" <${userEmail}>`,
      to: user.email,
      subject: "Reset Your Password - Verification Code",
      text: `Hello,\n\nYou requested a password reset for your Internship Portal account. Your 6-digit verification code is:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this reset, please ignore this email and your password will remain unchanged.\n\nRegards,\nInternship Portal Team`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Sent password reset verification code to ${user.email}`);

    return res.json({
      success: true,
      message: "A verification code has been sent to your registered email address."
    });
  } catch (error) {
    console.error("Forgot-password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/verify-reset-otp
 *
 * Body: { identifier, code }
 *
 * - Finds user by email or phone.
 * - Verifies that the verification code matches resetOTP and hasn't expired.
 */
router.post("/verify-reset-otp", async (req, res) => {
  const { identifier, code } = req.body;

  if (!identifier || !code || typeof identifier !== "string" || typeof code !== "string") {
    return res.status(400).json({
      success: false,
      message: "Identifier and verification code are required."
    });
  }

  const trimmedIdentifier = identifier.trim();
  const trimmedCode = code.trim();
  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let user = null;

    if (isDbConnected) {
      user = await User.findOne({
        $or: [
          { email: trimmedIdentifier },
          { phone: trimmedIdentifier }
        ]
      });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email === trimmedIdentifier || u.phone === trimmedIdentifier
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with that email or phone number."
      });
    }

    if (!user.resetOTP || user.resetOTP !== trimmedCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code."
      });
    }

    if (new Date(user.resetOTPExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired."
      });
    }

    return res.json({
      success: true,
      message: "Verification code verified successfully."
    });
  } catch (error) {
    console.error("Verify-otp error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/reset-password
 *
 * Body: { identifier, code, password }
 *
 * - Finds the user with matching identifier, resetOTP and resetOTPExpires.
 * - Updates their password to the new hashed password.
 * - Clears the resetOTP and resetOTPExpires.
 */
router.post("/reset-password", async (req, res) => {
  const { identifier, code, password } = req.body;

  if (!identifier || !code || !password || typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Identifier, verification code, and new password are required."
    });
  }

  const trimmedIdentifier = identifier.trim();
  const trimmedCode = code.trim();
  const isDbConnected = mongoose.connection.readyState === 1;
  const hashedPassword = hashPassword(password);

  try {
    let user = null;

    if (isDbConnected) {
      user = await User.findOne({
        $or: [
          { email: trimmedIdentifier },
          { phone: trimmedIdentifier }
        ],
        resetOTP: trimmedCode,
        resetOTPExpires: { $gt: new Date() }
      });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => (u.email === trimmedIdentifier || u.phone === trimmedIdentifier) &&
               u.resetOTP === trimmedCode &&
               new Date(u.resetOTPExpires) > new Date()
      );
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code."
      });
    }

    // Update password and clear OTP fields
    if (isDbConnected) {
      await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: { password: hashedPassword, updatedAt: new Date() },
          $unset: { resetOTP: 1, resetOTPExpires: 1 }
        }
      );
    } else {
      const key = user.uid || user.email;
      InMemoryUsers[key] = {
        ...user,
        password: hashedPassword,
        resetOTP: undefined,
        resetOTPExpires: undefined,
        updatedAt: new Date()
      };
    }

    return res.json({
      success: true,
      message: "Your password has been updated successfully. You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset-password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/change-password
 *
 * Body: { email, newPassword }
 *
 * - Finds user by email.
 * - Updates their password to the new hashed password.
 */
router.post("/change-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword || typeof newPassword !== "string" || newPassword.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Email and new password are required."
    });
  }

  const trimmedEmail = email.trim();
  const isDbConnected = mongoose.connection.readyState === 1;
  const hashedPassword = hashPassword(newPassword);

  try {
    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: new RegExp("^" + trimmedEmail + "$", "i") });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (isDbConnected) {
      await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
    } else {
      const key = user.uid || user.email;
      InMemoryUsers[key] = {
        ...user,
        password: hashedPassword,
        updatedAt: new Date()
      };
    }

    return res.json({
      success: true,
      message: "Your password has been updated successfully."
    });
  } catch (error) {
    console.error("Change-password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * GET /api/user/test-email
 * Diagnostic endpoint to test SMTP settings on the hosted server
 */
router.get("/test-email", async (req, res) => {
  const userEmail = process.env.EMAIL_SERVER_USER || "";
  const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
  const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
  const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

  if (!userEmail || !passEmail) {
    return res.status(400).json({
      success: false,
      message: "SMTP credentials not configured in environment variables."
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: hostEmail,
      port: portEmail,
      secure: portEmail === 465,
      auth: { user: userEmail, pass: passEmail }
    });

    const mailOptions = {
      from: `"Internship Portal Test" <${userEmail}>`,
      to: userEmail,
      subject: "SMTP Connection Test",
      text: "This is a test email to verify SMTP configuration on the hosted server."
    };

    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Test email sent successfully to " + userEmail
    });
  } catch (error) {
    console.error("SMTP Test Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * POST /api/user/login
 *
 * Body: { email, password }
 *
 * - Looks up user by email in MongoDB or InMemoryUsers.
 * - Hashing verification using local SHA-256.
 * - Returns user profile info on success.
 */
router.post("/login", async (req, res) => {
  const { email, password, deviceType } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please enter both email and password."
    });
  }

  const trimmedEmail = email.trim();
  const isDbConnected = mongoose.connection.readyState === 1;
  const hashedInputPassword = hashPassword(password);
  
  // Environment Detection
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || "127.0.0.1";
  const { browser, os, device } = parseUA(userAgent, deviceType);

  try {
    // 1. Mobile Time Restrictions check
    if (device === "mobile") {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      
      // Allowed only between 10:00 AM and 1:00 PM (10:00:00 - 13:00:00)
      const isBlocked = hrs < 10 || hrs > 13 || (hrs === 13 && (mins > 0 || secs > 0));
      
      if (isBlocked) {
        await recordLoginHistory({
          email: trimmedEmail,
          browser,
          os,
          device,
          ipAddress,
          status: "blocked",
          failureReason: "Blocked: Mobile logins are only allowed between 10:00 AM and 1:00 PM."
        });
        return res.status(403).json({
          success: false,
          message: "Access blocked: Mobile logins are only allowed between 10:00 AM and 1:00 PM."
        });
      }
    }

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: new RegExp("^" + trimmedEmail + "$", "i") });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
    }

    // 2. User Existence check
    if (!user) {
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "failed",
        failureReason: "Account not found"
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // 3. Password Verification check
    if (user.password !== hashedInputPassword) {
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "failed",
        failureReason: "Incorrect password"
      });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // 4. Google Chrome browser check -> requires OTP
    if (browser === "Chrome") {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      if (isDbConnected) {
        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { loginOTP: code, loginOTPExpires: expires } }
        );
      } else {
        user.loginOTP = code;
        user.loginOTPExpires = expires;
      }

      // Record pending OTP status
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "pending_otp"
      });

      // Send OTP Mail
      const userEmail = process.env.EMAIL_SERVER_USER || "";
      const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
      const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
      const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

      let devMode = false;
      if (!userEmail || !passEmail) {
        devMode = true;
        console.log(`[Developer Mode] SMTP not configured. Login OTP code for ${user.email} is: ${code}`);
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: hostEmail,
            port: portEmail,
            secure: portEmail === 465,
            auth: { user: userEmail, pass: passEmail }
          });

          const mailOptions = {
            from: `"Internship Portal" <${userEmail}>`,
            to: user.email,
            subject: "Security Verification - Login OTP",
            text: `Hello,\n\nYou are attempting to log in via Google Chrome. For security, please enter the following 6-digit verification code:\n\n${code}\n\nThis code will expire in 5 minutes.\n\nRegards,\nInternship Portal Team`
          };

          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error("Failed to send login OTP email:", mailErr);
        }
      }

      return res.json({
        success: true,
        otpRequired: true,
        email: user.email,
        message: "Verification code sent to your registered email.",
        devMode
      });
    }

    // 5. Successful login (for non-Chrome)
    await recordLoginHistory({
      email: trimmedEmail,
      browser,
      os,
      device,
      ipAddress,
      status: "success"
    });

    return res.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        uid: user.uid || user._id,
        email: user.email,
        name: user.name || "User",
        photo: user.photoURL || "/default-avatar.png",
        phoneNumber: user.phone || ""
      }
    });
  } catch (error) {
    console.error("Login route error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/register
 *
 * Body: { name, email, phone, password }
 *
 * - Registers a new user.
 * - Hashes password and persists details in MongoDB or InMemoryUsers fallback.
 */
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!email || !password || !name || typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please enter your name, email, and password."
    });
  }

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();
  const trimmedPhone = phone ? phone.trim() : null;

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let existingUser = null;
    if (isDbConnected) {
      existingUser = await User.findOne({ email: new RegExp("^" + trimmedEmail + "$", "i") });
    } else {
      existingUser = Object.values(InMemoryUsers).find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const hashedPassword = hashPassword(password);
    const uid = "user_" + crypto.randomBytes(8).toString("hex");

    const newUser = {
      uid,
      email: trimmedEmail,
      name: trimmedName,
      password: hashedPassword,
      photoURL: "/default-avatar.png",
      isPremium: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (trimmedPhone && trimmedPhone.trim() !== "") {
      newUser.phone = trimmedPhone;
    }

    if (isDbConnected) {
      const dbUser = new User(newUser);
      await dbUser.save();
    } else {
      InMemoryUsers[uid] = newUser;
    }

    return res.status(201).json({
      success: true,
      message: "Registered successfully.",
      user: {
        uid,
        email: trimmedEmail,
        name: trimmedName,
        photo: "/default-avatar.png",
        phoneNumber: trimmedPhone || ""
      }
    });
  } catch (error) {
    console.error("Register route error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/google-sync
 *
 * Body: { uid, email, name, photoURL }
 *
 * - Syncs Google sign-in users with database.
 * - Stores user if visiting/logging-in with Google for the first time.
 */
router.post("/google-sync", async (req, res) => {
  const { uid, email, name, photoURL, deviceType, isNewLoginAttempt } = req.body;

  if (!uid || !email) {
    return res.status(400).json({
      success: false,
      message: "UID and email are required for sync."
    });
  }

  const trimmedEmail = email.trim();
  const isDbConnected = mongoose.connection.readyState === 1;

  // Environment Detection
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || "127.0.0.1";
  const { browser, os, device } = parseUA(userAgent, deviceType);

  try {
    // 1. Mobile Time Restrictions check
    if (device === "mobile") {
      const now = new Date();
      const hrs = now.getHours();
      const mins = now.getMinutes();
      const secs = now.getSeconds();
      
      // Allowed only between 10:00 AM and 1:00 PM (10:00:00 - 13:00:00)
      const isBlocked = hrs < 10 || hrs > 13 || (hrs === 13 && (mins > 0 || secs > 0));
      
      if (isBlocked) {
        await recordLoginHistory({
          email: trimmedEmail,
          browser,
          os,
          device,
          ipAddress,
          status: "blocked",
          failureReason: "Blocked: Mobile logins are only allowed between 10:00 AM and 1:00 PM."
        });
        return res.status(403).json({
          success: false,
          message: "Access blocked: Mobile logins are only allowed between 10:00 AM and 1:00 PM."
        });
      }
    }

    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: new RegExp("^" + trimmedEmail + "$", "i") });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
    }

    // Ensure user exists or create them (so we can save loginOTP if Chrome)
    if (!user) {
      const newUser = {
        uid,
        email: trimmedEmail.toLowerCase(),
        name: name || "User",
        photoURL: photoURL || "/default-avatar.png",
        isPremium: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (isDbConnected) {
        user = new User(newUser);
        await user.save();
      } else {
        InMemoryUsers[uid] = newUser;
        user = newUser;
      }
    } else {
      // User exists, ensure uid and photoURL are synchronized
      if (isDbConnected) {
        user = await User.findOneAndUpdate(
          { email: new RegExp("^" + trimmedEmail + "$", "i") },
          {
            $set: {
              uid: uid,
              photoURL: photoURL || user.photoURL,
              updatedAt: new Date()
            }
          },
          { new: true }
        );
      } else {
        user.uid = uid;
        user.photoURL = photoURL || user.photoURL;
        user.updatedAt = new Date();
      }
    }

    // 2. Google Chrome browser check -> requires OTP before logging in
    if (browser === "Chrome" && isNewLoginAttempt === true) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      if (isDbConnected) {
        await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { loginOTP: code, loginOTPExpires: expires } }
        );
      } else {
        user.loginOTP = code;
        user.loginOTPExpires = expires;
      }

      // Record pending OTP status
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "pending_otp"
      });

      // Send OTP Mail
      const userEmail = process.env.EMAIL_SERVER_USER || "";
      const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
      const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
      const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");

      let devMode = false;
      if (!userEmail || !passEmail) {
        devMode = true;
        console.log(`[Developer Mode] SMTP not configured. Google Chrome Sync OTP code for ${user.email} is: ${code}`);
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: hostEmail,
            port: portEmail,
            secure: portEmail === 465,
            auth: { user: userEmail, pass: passEmail }
          });

          const mailOptions = {
            from: `"Internship Portal" <${userEmail}>`,
            to: user.email,
            subject: "Security Verification - Login OTP",
            text: `Hello,\n\nYou are attempting to log in with Google via Google Chrome. For security, please enter the following 6-digit verification code:\n\n${code}\n\nThis code will expire in 5 minutes.\n\nRegards,\nInternship Portal Team`
          };

          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error("Failed to send login OTP email:", mailErr);
        }
      }

      return res.json({
        success: true,
        otpRequired: true,
        email: user.email,
        message: "Google Chrome detected: Verification code sent to your registered email.",
        devMode
      });
    }

    // 3. Successful Google sync/login (for non-Chrome)
    await recordLoginHistory({
      email: trimmedEmail,
      browser,
      os,
      device,
      ipAddress,
      status: "success"
    });

    return res.json({
      success: true,
      message: "Google user synchronized successfully.",
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name || "User",
        photo: user.photoURL || "/default-avatar.png",
        phoneNumber: user.phone || ""
      }
    });
  } catch (error) {
    console.error("Google sync route error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * POST /api/user/verify-login-otp
 *
 * Body: { email, code, isGoogleSync, googleData, deviceType }
 *
 * - Verifies the login OTP.
 * - Completes registration/sync if Google Sync.
 * - Records success on correct OTP.
 */
router.post("/verify-login-otp", async (req, res) => {
  const { email, code, isGoogleSync, googleData, deviceType } = req.body;

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      message: "Email and verification code are required."
    });
  }

  const trimmedEmail = email.trim();
  const trimmedCode = code.trim();
  const isDbConnected = mongoose.connection.readyState === 1;

  // Environment Detection
  const userAgent = req.headers["user-agent"] || "";
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || "127.0.0.1";
  const { browser, os, device } = parseUA(userAgent, deviceType);

  try {
    let user = null;
    if (isDbConnected) {
      user = await User.findOne({ email: new RegExp("^" + trimmedEmail + "$", "i") });
    } else {
      user = Object.values(InMemoryUsers).find(
        (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase()
      );
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // Verify OTP
    if (!user.loginOTP || user.loginOTP !== trimmedCode) {
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "failed",
        failureReason: "Invalid verification code"
      });
      return res.status(400).json({
        success: false,
        message: "Invalid verification code."
      });
    }

    if (new Date(user.loginOTPExpires) < new Date()) {
      await recordLoginHistory({
        email: trimmedEmail,
        browser,
        os,
        device,
        ipAddress,
        status: "failed",
        failureReason: "Expired verification code"
      });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired."
      });
    }

    // Clear OTP
    if (isDbConnected) {
      await User.findOneAndUpdate(
        { _id: user._id },
        { $unset: { loginOTP: 1, loginOTPExpires: 1 } }
      );
    } else {
      user.loginOTP = undefined;
      user.loginOTPExpires = undefined;
    }

    // Handle Google Sync specific setup on verification success
    if (isGoogleSync && googleData) {
      const { uid, name, photoURL } = googleData;
      if (isDbConnected) {
        user = await User.findOneAndUpdate(
          { email: new RegExp("^" + trimmedEmail + "$", "i") },
          {
            $set: {
              uid: uid,
              photoURL: photoURL || user.photoURL,
              updatedAt: new Date()
            }
          },
          { new: true }
        );
      } else {
        user.uid = uid;
        user.photoURL = photoURL || user.photoURL;
        user.updatedAt = new Date();
      }
    }

    // Success log
    await recordLoginHistory({
      email: trimmedEmail,
      browser,
      os,
      device,
      ipAddress,
      status: "success"
    });

    return res.json({
      success: true,
      message: "Logged in successfully.",
      user: {
        uid: user.uid || user._id,
        email: user.email,
        name: user.name || "User",
        photo: user.photoURL || "/default-avatar.png",
        phoneNumber: user.phone || ""
      }
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

/**
 * GET /api/user/login-history/:email
 *
 * Returns login history for the specified user email.
 */
router.get("/login-history/:email", async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required."
    });
  }

  const isDbConnected = mongoose.connection.readyState === 1;

  try {
    let history = [];
    if (isDbConnected) {
      history = await LoginHistory.find({ email: new RegExp("^" + email.trim() + "$", "i") })
        .sort({ timestamp: -1 })
        .limit(50);
    } else {
      history = InMemoryLoginHistory.filter(
        (h) => h.email.toLowerCase() === email.trim().toLowerCase()
      ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);
    }

    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error("Get login history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch login history."
    });
  }
});



// Seed some in-memory mock users so the feature is testable in offline/sandbox mode
(function seedInMemoryUsers() {
  InMemoryUsers["mock_user_1"] = {
    uid: "mock_user_1",
    email: "testuser@example.com",
    phone: "1234567890",
    name: "Test User",
    password: hashPassword("InitialPassword"),
    isPremium: false,
    lastPasswordResetRequest: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  InMemoryUsers["mock_user_2"] = {
    uid: "mock_user_2",
    email: "jane@example.com",
    phone: "9876543210",
    name: "Jane Doe",
    password: hashPassword("JaneInitial"),
    isPremium: false,
    lastPasswordResetRequest: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
})();

module.exports = router;
