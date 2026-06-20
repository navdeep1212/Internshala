const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("../Model/Post");
const User = require("../Model/User");
const Friendship = require("../Model/Friendship");

// ─── Multer Setup ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "..", "uploads", "public-space");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "post-" + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImage = /jpeg|jpg|png|gif|webp/;
  const allowedVideo = /mp4|webm/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
  const mime = file.mimetype;

  if (allowedImage.test(ext) && mime.startsWith("image/")) {
    cb(null, true);
  } else if (allowedVideo.test(ext) && mime.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, png, gif, webp) and videos (mp4, webm) are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// ─── Helper: Get friend count for a user uid ─────────────────────────────────
async function getFriendCount(uid) {
  return Friendship.countDocuments({
    status: "accepted",
    $or: [{ requesterUid: uid }, { recipientUid: uid }]
  });
}

// ─── Helper: Get today's post count for a user uid ───────────────────────────
async function getTodayPostCount(uid) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return Post.countDocuments({
    authorUid: uid,
    createdAt: { $gte: startOfDay }
  });
}

// ─── Helper: Calculate posting limit based on friend count ───────────────────
function getPostingLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount <= 10) return friendCount; // 1 friend=1/day, 2=2/day, ... 10=10/day
  return Infinity; // >10 friends = unlimited
}

// ─── GET /api/public-space/posts ─────────────────────────────────────────────
// Fetch all posts, paginated, newest first
router.get("/posts", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments()
    ]);

    return res.json({
      success: true,
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Get posts error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/public-space/posts ────────────────────────────────────────────
// Create a new post (with optional media upload)
router.post("/posts", upload.single("media"), async (req, res) => {
  const { authorUid, content } = req.body;

  if (!authorUid) {
    // Clean up uploaded file if validation fails
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: "Author UID is required." });
  }

  if (!content && !req.file) {
    return res.status(400).json({ success: false, message: "Please provide some content or upload media." });
  }

  try {
    // Find the author
    const author = await User.findOne({ uid: authorUid });
    if (!author) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check friend count and posting limit
    const friendCount = await getFriendCount(authorUid);
    const postingLimit = getPostingLimit(friendCount);

    if (postingLimit === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "You need at least 1 friend to post in the Public Space. Start connecting with others!",
        friendCount: 0,
        postingLimit: 0
      });
    }

    if (postingLimit !== Infinity) {
      const todayCount = await getTodayPostCount(authorUid);
      if (todayCount >= postingLimit) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(429).json({
          success: false,
          message: `You've reached your daily posting limit (${postingLimit} post${postingLimit > 1 ? "s" : ""}/day with ${friendCount} friend${friendCount > 1 ? "s" : ""}). Add more friends to increase your limit!`,
          friendCount,
          postingLimit,
          todayCount
        });
      }
    }

    // Determine media type
    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaUrl = "/uploads/public-space/" + req.file.filename;
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    }

    const post = new Post({
      author: author._id,
      authorUid: author.uid,
      authorName: author.name || "User",
      authorPhoto: author.photoURL || "/default-avatar.png",
      content: content || "",
      mediaUrl,
      mediaType,
    });

    await post.save();

    // Return posting limit info too
    const todayCount = await getTodayPostCount(authorUid);

    return res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post,
      postingInfo: {
        friendCount,
        postingLimit: postingLimit === Infinity ? "unlimited" : postingLimit,
        todayCount
      }
    });
  } catch (error) {
    console.error("Create post error:", error);
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── DELETE /api/public-space/posts/:id ──────────────────────────────────────
// Delete own post
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { userUid } = req.body;

  if (!userUid) {
    return res.status(400).json({ success: false, message: "User UID is required." });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    if (post.authorUid !== userUid) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts." });
    }

    // Delete associated media file
    if (post.mediaUrl) {
      const filePath = path.join(__dirname, "..", post.mediaUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Post.deleteOne({ _id: post._id });

    return res.json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    console.error("Delete post error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/public-space/posts/:id/like ───────────────────────────────────
// Toggle like on a post
router.post("/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  const { userUid } = req.body;

  if (!userUid) {
    return res.status(400).json({ success: false, message: "User UID is required." });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const alreadyLiked = post.likeUids.includes(userUid);

    if (alreadyLiked) {
      // Unlike
      post.likeUids = post.likeUids.filter((u) => u !== userUid);
      post.likes = post.likes.filter((l) => !l.equals(user._id));
    } else {
      // Like
      post.likeUids.push(userUid);
      post.likes.push(user._id);
    }

    post.updatedAt = new Date();
    await post.save();

    return res.json({
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likes.length,
      message: alreadyLiked ? "Post unliked." : "Post liked!"
    });
  } catch (error) {
    console.error("Like post error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/public-space/posts/:id/comment ────────────────────────────────
// Add a comment to a post
router.post("/posts/:id/comment", async (req, res) => {
  const { id } = req.params;
  const { userUid, text } = req.body;

  if (!userUid || !text || text.trim() === "") {
    return res.status(400).json({ success: false, message: "User UID and comment text are required." });
  }

  if (text.length > 500) {
    return res.status(400).json({ success: false, message: "Comment must be 500 characters or less." });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const user = await User.findOne({ uid: userUid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const comment = {
      user: user._id,
      userName: user.name || "User",
      userPhoto: user.photoURL || "/default-avatar.png",
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    post.updatedAt = new Date();
    await post.save();

    const savedComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: "Comment added!",
      comment: savedComment,
      commentCount: post.comments.length
    });
  } catch (error) {
    console.error("Comment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── DELETE /api/public-space/posts/:postId/comment/:commentId ───────────────
// Delete own comment
router.delete("/posts/:postId/comment/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;
  const { userUid } = req.body;

  if (!userUid) {
    return res.status(400).json({ success: false, message: "User UID is required." });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    // Check if the user owns the comment or the post
    const user = await User.findOne({ uid: userUid });
    if (!user || (!comment.user.equals(user._id) && post.authorUid !== userUid)) {
      return res.status(403).json({ success: false, message: "You can only delete your own comments." });
    }

    post.comments.pull({ _id: commentId });
    post.updatedAt = new Date();
    await post.save();

    return res.json({
      success: true,
      message: "Comment deleted.",
      commentCount: post.comments.length
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── POST /api/public-space/posts/:id/share ──────────────────────────────────
// Increment share count
router.post("/posts/:id/share", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 }, $set: { updatedAt: new Date() } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    return res.json({
      success: true,
      message: "Post shared!",
      shareCount: post.shareCount
    });
  } catch (error) {
    console.error("Share post error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ─── GET /api/public-space/posting-info/:uid ─────────────────────────────────
// Get posting limit info for a user
router.get("/posting-info/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const friendCount = await getFriendCount(uid);
    const postingLimit = getPostingLimit(friendCount);
    const todayCount = await getTodayPostCount(uid);

    return res.json({
      success: true,
      friendCount,
      postingLimit: postingLimit === Infinity ? "unlimited" : postingLimit,
      todayCount,
      canPost: postingLimit > 0 && (postingLimit === Infinity || todayCount < postingLimit)
    });
  } catch (error) {
    console.error("Posting info error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

module.exports = router;
