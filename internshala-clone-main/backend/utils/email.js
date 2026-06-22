const nodemailer = require("nodemailer");
const axios = require("axios");

async function sendEmail({ to, subject, text, html }) {
  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL || "";
  const brevoApiKey = process.env.BREVO_API_KEY || "";
  
  const userEmail = process.env.EMAIL_SERVER_USER || "";
  const passEmail = process.env.EMAIL_SERVER_PASSWORD || "";
  const hostEmail = process.env.EMAIL_SERVER_HOST || "smtp.gmail.com";
  const portEmail = parseInt(process.env.EMAIL_SERVER_PORT || "465");
  const otpSecret = process.env.OTP_SECRET || "fallback_otp_secret_key_1234567890";

  let errors = [];

  // Option 1: Google Apps Script HTTP Relay
  if (googleScriptUrl) {
    try {
      console.log(`[Email Dispatch] Attempting Google Apps Script HTTP Relay to ${to}`);
      const payload = {
        secret: otpSecret,
        to: to,
        subject: subject,
        text: text,
        html: html
      };
      
      const response = await axios.post(googleScriptUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 5000
      });
      
      if (response.data && response.data.success) {
        console.log(`[Google Script Success] Email sent successfully to ${to}`);
        return { success: true, method: "google-script" };
      } else {
        throw new Error((response.data && response.data.error) || "Unknown Google Apps Script error");
      }
    } catch (error) {
      console.error("[Google Script Error] Failed:", error.message);
      errors.push("Google Apps Script: " + error.message);
    }
  }

  // Option 2: Brevo HTTP API
  if (brevoApiKey) {
    try {
      console.log(`[Email Dispatch] Attempting Brevo HTTP API to ${to}`);
      const payload = {
        sender: { name: "Internship Portal", email: userEmail || "no-reply@internship-portal.com" },
        to: [{ email: to }],
        subject: subject,
        textContent: text,
        htmlContent: html || text.replace(/\n/g, "<br>")
      };

      const response = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },
        timeout: 5000
      });

      if (response.status === 201 || response.status === 200) {
        console.log(`[Brevo API Success] Email sent successfully to ${to}. MessageId: ${response.data.messageId}`);
        return { success: true, method: "brevo-api" };
      } else {
        throw new Error(JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("[Brevo API Error] Failed:", error.message);
      errors.push("Brevo API: " + error.message);
    }
  }

  // Option 3: Direct SMTP using Nodemailer
  if (userEmail && passEmail) {
    try {
      console.log(`[Email Dispatch] Attempting SMTP sending to ${to}`);
      const transporter = nodemailer.createTransport({
        host: hostEmail,
        port: portEmail,
        secure: portEmail === 465,
        auth: { user: userEmail, pass: passEmail },
        family: 4,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000
      });

      const mailOptions = {
        from: `"Internship Portal" <${userEmail}>`,
        to,
        subject,
        text,
        html
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP Success] Email sent successfully to ${to}`);
      return { success: true, method: "smtp" };
    } catch (error) {
      console.error("[SMTP Error] Failed:", error.message);
      errors.push("SMTP: " + error.message);
    }
  }

  // Graceful Fallback: print to console so user can always see the OTP code
  console.log(`[Developer Fallback Mode] Active due to failed sending options or lack of credentials.
Errors encountered: ${errors.join(" | ") || "None"}
=========================================
TO: ${to}
SUBJECT: ${subject}
BODY:
${text}
=========================================`);
  return { success: true, method: "console", errors };
}

module.exports = { sendEmail };
