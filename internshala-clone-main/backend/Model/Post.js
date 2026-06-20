const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  userPhoto: { type: String, default: "/default-avatar.png" },
  text: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  authorUid: { type: String, required: true },
  authorName: { type: String, required: true },
  authorPhoto: { type: String, default: "/default-avatar.png" },
  content: { type: String, maxlength: 2000 },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ["image", "video", null], default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likeUids: [{ type: String }],
  comments: [CommentSchema],
  shareCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PostSchema.index({ createdAt: -1 });
PostSchema.index({ authorUid: 1 });

module.exports = mongoose.model("Post", PostSchema);
