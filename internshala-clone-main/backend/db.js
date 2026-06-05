const mongoose = require("mongoose");
require("dotenv").config();

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Database is connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};