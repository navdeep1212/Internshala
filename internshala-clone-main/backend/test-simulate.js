const mongoose = require("mongoose");
const User = require("./Model/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_jwt_signing_secret_key_12345";

async function test() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("DB connected");

    const reqBody = {
      uid: 'user_fcab4bef1be4c0af',
      email: 'navdeepchaurasia12@gmail.com',
      name: 'navdeep',
      photoURL: '/default-avatar.png'
    };

    const { uid, email, name, photoURL } = reqBody;

    console.log("Finding user with uid:", uid);
    let user = await User.findOne({ uid });
    console.log("Found user:", user);

    if (!user) {
      user = { uid, email, name, photoURL, isPremium: false, createdAt: new Date() };
      const newUser = new User(user);
      await newUser.save();
      console.log("New user saved successfully");
    } else {
      user.name = name || user.name;
      user.photoURL = photoURL || user.photoURL;
      console.log("Updating existing user...");
      
      // THIS IS THE LINE IN ROUTES/RESUME.JS:
      // await User.findOneAndUpdate({ uid }, { name: user.name, photoURL: user.photoURL, updatedAt: Date.now() });
      const updated = await User.findOneAndUpdate({ uid }, { name: user.name, photoURL: user.photoURL, updatedAt: Date.now() });
      console.log("User updated successfully:", updated);
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, isPremium: user.isPremium },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("Token generated successfully:", token);
  } catch (err) {
    console.error("Caught error in simulation:", err);
  } finally {
    await mongoose.connection.close();
  }
}

test();
