const express = require("express");
const router = express.Router();
const application = require("../Model/Application");

const Resume = require("../Model/Resume");

router.post("/", async (req, res) => {
  let userObj = req.body.user;
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
    .then((data) => {
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
