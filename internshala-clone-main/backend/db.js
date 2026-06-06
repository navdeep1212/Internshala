const mongoose = require("mongoose");
require("dotenv").config();

module.exports.connect = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 5000 });
    console.log("Database is connected successfully to Cloud MongoDB Atlas");
  } catch (error) {
    console.error("Database cloud connection failed. Error details:", error.message);
    console.log("Attempting local MongoDB connection fallback (mongodb://localhost:27017/internarea)...");
    try {
      await mongoose.connect("mongodb://localhost:27017/internarea");
      console.log("Database fallback connection successful to local MongoDB");
    } catch (localError) {
      console.error("Local MongoDB connection also failed. Server will start with in-memory database fallback to avoid crashing.");
    }
  }
};