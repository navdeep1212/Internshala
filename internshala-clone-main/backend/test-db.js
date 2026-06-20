const mongoose = require("mongoose");
const User = require("./Model/User");
require("dotenv").config();

async function test() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL);
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("Connected successfully!");
    
    console.log("Searching for any user...");
    const user = await User.findOne({});
    console.log("Found user:", user);
  } catch (err) {
    console.error("Error during DB test:", err);
  } finally {
    await mongoose.connection.close();
  }
}

test();
