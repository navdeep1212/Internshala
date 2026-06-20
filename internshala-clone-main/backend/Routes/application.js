const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const application = require("../Model/Application");
const Resume = require("../Model/Resume");
const User = require("../Model/User");

// Plan limits constant (mirrors resume.js)
const PLAN_LIMITS = {
  free:   { limit: 1,        label: "Free" },
  bronze: { limit: 3,        label: "Bronze" },
  silver: { limit: 5,        label: "Silver" },
  gold:   { limit: Infinity, label: "Gold" }
};

// Helper: check if two dates are in the same calendar month
function isSameMonth(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

router.post("/", async (req, res) => {
  let userObj = req.body.user;

  // ── Subscription Limit Enforcement ──────────────────────
  if (userObj && userObj.uid) {
    try {
      const isDbConnected = mongoose.connection.readyState === 1;
      let userDoc = null;
      if (isDbConnected) {
        userDoc = await User.findOne({ uid: userObj.uid });
      }

      if (userDoc) {
        const now = new Date();
        const sub = userDoc.subscription || {};
        const plan = sub.plan || "free";
        const planInfo = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const lastReset = sub.lastResetAt ? new Date(sub.lastResetAt) : new Date(0);

        // Auto-reset monthly count if it's a new calendar month
        let applicationsUsed = sub.applicationsUsedThisMonth || 0;
        if (!isSameMonth(lastReset, now)) {
          applicationsUsed = 0;
          await User.findOneAndUpdate(
            { uid: userObj.uid },
            {
              "subscription.applicationsUsedThisMonth": 0,
              "subscription.lastResetAt": now
            }
          );
        }

        // Check if plan limit is hit
        if (planInfo.limit !== Infinity && applicationsUsed >= planInfo.limit) {
          return res.status(403).json({
            error: "Application limit reached for your subscription plan.",
            plan,
            planLabel: planInfo.label,
            limit: planInfo.limit,
            used: applicationsUsed,
            message: `You have used ${applicationsUsed}/${planInfo.limit} applications this month on the ${planInfo.label} plan. Upgrade your plan to apply for more internships.`,
            upgradeUrl: "/subscription"
          });
        }
      }
    } catch (limitErr) {
      // Non-blocking — log but don't fail the entire request
      console.error("Subscription limit check error:", limitErr);
    }
  }
  // ────────────────────────────────────────────────────────

  // Auto-attach latest resume
  if (userObj && userObj.uid) {
    try {
      const latestResume = await Resume.findOne({ user_id: userObj.uid, pdfUrl: { $ne: null } })
        .sort({ createdAt: -1 });
      if (latestResume) {
        userObj.resume_id = latestResume._id;
        userObj.resume_url = latestResume.pdfUrl;
        userObj.template_used = latestResume.templateUsed;
        userObj.generated_at = latestResume.createdAt;
      }
    } catch (err) {
      console.error("Error auto-attaching resume:", err);
    }
  }

  const applicationipdata = new application({
    company: req.body.company,
    category: req.body.category,
    coverLetter: req.body.coverLetter,
    user: userObj,
    Application: req.body.Application,
    body: req.body.body,
    availability: req.body.availability,
  });

  await applicationipdata
    .save()
    .then(async (data) => {
      // Increment application count for the user
      if (userObj && userObj.uid) {
        try {
          if (mongoose.connection.readyState === 1) {
            await User.findOneAndUpdate(
              { uid: userObj.uid },
              { $inc: { "subscription.applicationsUsedThisMonth": 1 } }
            );
          }
        } catch (incErr) {
          console.error("Failed to increment application count:", incErr);
        }
      }
      res.send(data);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ error: "failed to save application" });
    });
});

router.get("/", async (req, res) => {
  try {
    const data = await application.find();
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await application.findById(id);
    if (!data) {
      res.status(404).json({ error: "application not found" });
    }
    res.json(data).status(200);
  } catch (error) {
    console.log(error);
    res.status(404).json({ error: "internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  let status;
  if (action === "accepted") {
    status = "accepted";
  } else if (action === "rejected") {
    status = "rejected";
  } else {
    res.status(404).json({ error: "Invalid action" });
    return;
  }
  try {
    const updateapplication = await application.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updateapplication) {
      res.status(404).json({ error: "Not able to update the application" });
      return;
    }
    res.status(200).json({ sucess: true, data: updateapplication });
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;

