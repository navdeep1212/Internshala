const mongoose = require("mongoose");
const User = require("./Model/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_signing_secret_key_12345";

async function test() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("DB connected");

    // Let's print all users first to see what's in the DB
    const users = await User.find({});
    console.log("All users in DB:", users);

    // Let's test the auth-token login exchange logic with a sample payload
    // Typically, the payload from frontend Redux user slice could look like:
    // uid: something, email: something, name: something, photoURL: something
    // Let's simulate with the user from Redux if we can guess, or let's create a test one.
    // Wait, let's look at what the frontend actually has for the logged-in user!
    // In Redux, let's see how the user is registered or logged in.
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await mongoose.connection.close();
  }
}

test();
