const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // Firebase uid
  personalInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    objective: { type: String },
    photoUrl: { type: String }, // path/URL to user's uploaded profile photo
  },
  education: [{
    degree: String,
    college: String,
    branch: String,
    startYear: String,
    endYear: String,
    cgpa: String,
  }],
  skills: [String], // Array of skills tags
  experience: [{
    company: String,
    role: String,
    description: String,
    startDate: String,
    endDate: String,
  }],
  projects: [{
    name: String,
    technologies: String,
    description: String,
    githubLink: String,
    liveLink: String,
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: String,
  }],
  achievements: [String],
  languages: [String],
  hobbies: [String],
  templateUsed: { type: String, default: "Template 1" },
  pdfUrl: { type: String }, // uploads/resumes/{userId}/{resumeId}.pdf
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", ResumeSchema);
