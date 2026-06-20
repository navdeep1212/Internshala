const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application");
const resume = require("./resume");
const user = require("./user");
const publicSpace = require("./publicSpace");
const friendship = require("./friendship");

router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/resume", resume);
router.use("/user", user);
router.use("/public-space", publicSpace);
router.use("/friends", friendship);

module.exports = router;
