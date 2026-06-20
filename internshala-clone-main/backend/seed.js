const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();
const Internship = require("./Model/Internship");
const Job = require("./Model/Job");
const User = require("./Model/User");

// Helper to hash passwords with SHA-256
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Mock users for testing the Forgot Password feature
const users = [
  {
    uid: "seed_user_1",
    email: "testuser@example.com",
    phone: "1234567890",
    name: "Test User",
    password: hashPassword("TestPassword"),
    isPremium: false,
    lastPasswordResetRequest: null
  },
  {
    uid: "seed_user_2",
    email: "jane@example.com",
    phone: "9876543210",
    name: "Jane Doe",
    password: hashPassword("JanePassword"),
    isPremium: true,
    lastPasswordResetRequest: null
  },
  {
    uid: "seed_user_3",
    email: "rahul@example.com",
    phone: "5551234567",
    name: "Rahul Kumar",
    password: hashPassword("RahulPassword"),
    isPremium: false,
    lastPasswordResetRequest: null
  }
];

const internships = [
  {
    title: "Software Engineering Intern",
    company: "Google India",
    location: "Bangalore",
    category: "Engineering",
    aboutCompany: "Google's mission is to organize the world's information and make it universally accessible and useful.",
    aboutInternship: "We are looking for a Software Engineer Intern to join our developer teams. You will work on real-world projects, design software architectures, and write code in C++, Java, or Go.",
    whoCanApply: "Currently pursuing a Bachelor's, Master's or PhD in Computer Science or related fields. Experience in coding.",
    perks: ["Certificate", "Letter of recommendation", "Flexible work hours", "Free snacks"],
    numberOfOpening: "5",
    stipend: "₹100,000 /month",
    startDate: "Immediately",
    additionalInfo: "This is a full-time 3-month summer internship."
  },
  {
    title: "Data Science Intern",
    company: "Microsoft",
    location: "Hyderabad",
    category: "Data Science",
    aboutCompany: "Microsoft enables digital transformation for the era of an intelligent cloud and an intelligent edge.",
    aboutInternship: "In this role, you will perform data modeling, analysis, and build dashboards in PowerBI to support team business decision making.",
    whoCanApply: "Proficient in Python, SQL, and Excel. Good statistical skills.",
    perks: ["Certificate", "Letter of recommendation", "5 days a week"],
    numberOfOpening: "2",
    stipend: "₹80,000 /month",
    startDate: "Immediate",
    additionalInfo: "Duration: 6 months."
  },
  {
    title: "Marketing Intern",
    company: "Paytm",
    location: "Noida",
    category: "MBA",
    aboutCompany: "Paytm is India's leading financial services company offering payment solutions.",
    aboutInternship: "Drive digital marketing campaigns, assist in keyword research, SEO optimization, and social media outreach.",
    whoCanApply: "Strong written communication skills. Pursuing MBA or equivalent marketing degree.",
    perks: ["Certificate", "Letter of recommendation", "Flexible hours"],
    numberOfOpening: "3",
    stipend: "₹15,000 /month",
    startDate: "Immediately",
    additionalInfo: "Duration: 2 months."
  },
  {
    title: "Graphic Design Intern",
    company: "Swiggy",
    location: "Work From Home",
    category: "Design",
    aboutCompany: "Swiggy is India's leading on-demand delivery platform.",
    aboutInternship: "Create engaging social media posts, visual banners, and UI elements for promotional marketing campaigns.",
    whoCanApply: "Proficient in Adobe Photoshop, Illustrator, and Figma. Strong design portfolio.",
    perks: ["Certificate", "Flexible hours", "Letter of recommendation"],
    numberOfOpening: "4",
    stipend: "₹12,000 /month",
    startDate: "Immediately",
    additionalInfo: "Duration: 3 months."
  }
];

const jobs = [
  {
    title: "Backend Developer",
    company: "Paytm",
    location: "Bangalore",
    Experience: "1-3 years",
    category: "Engineering",
    aboutCompany: "Paytm is India's leading digital payment platform.",
    aboutJob: "Design and implement high-performance web services, manage MongoDB database integrations, and maintain scalable APIs.",
    whoCanApply: "1-3 years of Node.js/Express backend development experience. Good understanding of database design.",
    perks: ["Health Insurance", "Stock Options", "Flexible Hours", "Gym membership"],
    AdditionalInfo: "Competitive package with rapid growth path.",
    CTC: "₹12 - 15 Lakhs/annum",
    StartDate: "Immediate"
  },
  {
    title: "Full Stack Engineer",
    company: "Zomato",
    location: "Gurgaon",
    Experience: "2-4 years",
    category: "Engineering",
    aboutCompany: "Zomato is a leading global restaurant discovery and food delivery portal.",
    aboutJob: "Build responsive web applications in React.js, configure robust backend services in Django/Node, and deploy with AWS.",
    whoCanApply: "B.Tech/M.Tech. Hands-on coding experience in JavaScript, React, Node, and AWS.",
    perks: ["Paid Leaves", "Free Meals", "Health Coverage"],
    AdditionalInfo: "Opportunity to scale microservices.",
    CTC: "₹18 - 24 Lakhs/annum",
    StartDate: "Immediate"
  },
  {
    title: "Business Analyst",
    company: "Deloitte",
    location: "Mumbai",
    Experience: "0-2 years",
    category: "MBA",
    aboutCompany: "Deloitte provides audit, consulting, financial advisory, and risk management services.",
    aboutJob: "Engage with corporate clients, gather business requirements, define technical scope specifications, and analyze system data.",
    whoCanApply: "MBA graduate with excellent presentation, client interaction, and data analysis skills.",
    perks: ["Professional Training", "Travel allowance", "Health Benefits"],
    AdditionalInfo: "Global clients portfolio exposure.",
    CTC: "₹8 - 10 Lakhs/annum",
    StartDate: "Immediate"
  }
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  let connected = false;
  
  try {
    console.log("Connecting to Cloud MongoDB Atlas...");
    await mongoose.connect(dbUrl);
    connected = true;
    console.log("Connected to Cloud MongoDB Atlas.");
  } catch (err) {
    console.log("Cloud MongoDB Atlas connection failed. Trying local fallback database...");
    try {
      await mongoose.connect("mongodb://localhost:27017/internarea");
      connected = true;
      console.log("Connected to local database 'internarea'.");
    } catch (localErr) {
      console.error("Failed to connect to local database also:", localErr);
    }
  }

  if (!connected) {
    console.error("No database connection available. Exiting.");
    process.exit(1);
  }

  try {
    // Drop existing collections to refresh
    console.log("Clearing existing internships, jobs, and users...");
    await Internship.deleteMany({});
    await Job.deleteMany({});
    await User.deleteMany({});

    // Seed new entries
    console.log("Seeding internships...");
    await Internship.insertMany(internships);
    
    console.log("Seeding jobs...");
    await Job.insertMany(jobs);

    console.log("Seeding users...");
    await User.insertMany(users);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seed();
