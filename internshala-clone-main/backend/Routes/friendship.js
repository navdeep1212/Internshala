const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../Model/User");
const Friendship = require("../Model/Friendship");

/**
 * POST /api/friends/request
 * Body: { requesterUid, recipientUid }
 * Send a friend request
 */
router.post("/request", async (req, res) => {
  const { requesterUid, recipientUid } = req.body;

  if (!requesterUid || !recipientUid) {
    return res.status(400).json({ success: false, message: "Both user IDs are required." });
  }

  if (requesterUid === recipientUid) {
    return res.status(400).json({ success: false, message: "You cannot send a friend request to yourself." });
  }

  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({ success: false, message: "Database not connected." });
  }

  try {
    const requester = await User.findOne({ uid: requesterUid });
    const recipient = await User.findOne({ uid: recipientUid });

    if (!requester || !recipient) {
      return res.status(404).json({ success: false, message: "One or both users not found." });
    }

    // Check if a friendship already exists in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: requester._id, recipient: recipient._id },
        { requester: recipient._id, recipient: requester._id }
      ]
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ success: false, message: "You are already friends." });
      }
      if (existing.status === "pending") {
        return res.status(409).json({ success: false, message: "A friend request already exists between you two." });
      }
      // If rejected, allow re-request by deleting old and creating new
      await Friendship.deleteOne({ _id: existing._id });
    }

    const friendship = new Friendship({
      requester: requester._id,
      requesterUid: requester.uid,
      requesterName: requester.name || "User",
      requesterPhoto: requester.photoURL || "/default-avatar.png",
      recipient: recipient._id,
      recipientUid: recipient.uid,
      recipientName: recipient.name || "User",
      recipientPhoto: recipient.photoURL || "/default-avatar.png",
      status: "pending"
    });

    await friendship.save();

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully.",
      friendship
    });
  } catch (error) {
    console.error("Friend request error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * POST /api/friends/accept
 * Body: { friendshipId, recipientUid }
 * Accept a pending friend request
 */
router.post("/accept", async (req, res) => {
  const { friendshipId, recipientUid } = req.body;

  if (!friendshipId || !recipientUid) {
    return res.status(400).json({ success: false, message: "Friendship ID and recipient UID are required." });
  }

  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ success: false, message: "Friend request not found." });
    }

    if (friendship.recipientUid !== recipientUid) {
      return res.status(403).json({ success: false, message: "You can only accept requests sent to you." });
    }

    if (friendship.status !== "pending") {
      return res.status(400).json({ success: false, message: "This request has already been handled." });
    }

    friendship.status = "accepted";
    await friendship.save();

    return res.json({
      success: true,
      message: "Friend request accepted!",
      friendship
    });
  } catch (error) {
    console.error("Accept friend error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * POST /api/friends/reject
 * Body: { friendshipId, recipientUid }
 * Reject or cancel a friend request
 */
router.post("/reject", async (req, res) => {
  const { friendshipId, recipientUid } = req.body;

  if (!friendshipId || !recipientUid) {
    return res.status(400).json({ success: false, message: "Friendship ID and user UID are required." });
  }

  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ success: false, message: "Friend request not found." });
    }

    // Allow both requester (cancel) and recipient (reject) to reject
    if (friendship.recipientUid !== recipientUid && friendship.requesterUid !== recipientUid) {
      return res.status(403).json({ success: false, message: "You are not part of this friend request." });
    }

    await Friendship.deleteOne({ _id: friendship._id });

    return res.json({ success: true, message: "Friend request removed." });
  } catch (error) {
    console.error("Reject friend error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * DELETE /api/friends/remove
 * Body: { userUid, friendUid }
 * Remove an existing friendship
 */
router.delete("/remove", async (req, res) => {
  const { userUid, friendUid } = req.body;

  if (!userUid || !friendUid) {
    return res.status(400).json({ success: false, message: "Both UIDs are required." });
  }

  try {
    const result = await Friendship.deleteOne({
      status: "accepted",
      $or: [
        { requesterUid: userUid, recipientUid: friendUid },
        { requesterUid: friendUid, recipientUid: userUid }
      ]
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Friendship not found." });
    }

    return res.json({ success: true, message: "Friend removed successfully." });
  } catch (error) {
    console.error("Remove friend error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * GET /api/friends/list/:uid
 * Get all accepted friends for a user
 */
router.get("/list/:uid", async (req, res) => {
  const { uid } = req.params;

  if (!uid) {
    return res.status(400).json({ success: false, message: "User UID is required." });
  }

  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requesterUid: uid }, { recipientUid: uid }]
    }).sort({ createdAt: -1 });

    // Map to friend info (the other person)
    const friends = friendships.map((f) => {
      if (f.requesterUid === uid) {
        return {
          friendshipId: f._id,
          uid: f.recipientUid,
          name: f.recipientName,
          photo: f.recipientPhoto,
          since: f.createdAt
        };
      } else {
        return {
          friendshipId: f._id,
          uid: f.requesterUid,
          name: f.requesterName,
          photo: f.requesterPhoto,
          since: f.createdAt
        };
      }
    });

    return res.json({ success: true, friends, count: friends.length });
  } catch (error) {
    console.error("List friends error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * GET /api/friends/requests/:uid
 * Get pending incoming friend requests for a user
 */
router.get("/requests/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const requests = await Friendship.find({
      recipientUid: uid,
      status: "pending"
    }).sort({ createdAt: -1 });

    const formatted = requests.map((r) => ({
      friendshipId: r._id,
      fromUid: r.requesterUid,
      fromName: r.requesterName,
      fromPhoto: r.requesterPhoto,
      createdAt: r.createdAt
    }));

    return res.json({ success: true, requests: formatted, count: formatted.length });
  } catch (error) {
    console.error("Get requests error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * GET /api/friends/count/:uid
 * Get the accepted friend count for a user
 */
router.get("/count/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    const count = await Friendship.countDocuments({
      status: "accepted",
      $or: [{ requesterUid: uid }, { recipientUid: uid }]
    });

    return res.json({ success: true, count });
  } catch (error) {
    console.error("Friend count error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

/**
 * GET /api/friends/search?q=<query>&currentUid=<uid>
 * Search users by name, excluding the current user
 */
router.get("/search", async (req, res) => {
  const { q, currentUid } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ success: true, users: [] });
  }

  try {
    const users = await User.find({
      name: { $regex: q.trim(), $options: "i" },
      uid: { $ne: currentUid }
    })
      .limit(20)
      .select("uid name email photoURL");

    // Get existing friendships for context
    const friendships = currentUid
      ? await Friendship.find({
          $or: [{ requesterUid: currentUid }, { recipientUid: currentUid }]
        })
      : [];

    const formatted = users.map((u) => {
      const friendship = friendships.find(
        (f) =>
          (f.requesterUid === currentUid && f.recipientUid === u.uid) ||
          (f.recipientUid === currentUid && f.requesterUid === u.uid)
      );

      return {
        uid: u.uid,
        name: u.name || "User",
        email: u.email,
        photo: u.photoURL || "/default-avatar.png",
        friendshipStatus: friendship ? friendship.status : null,
        friendshipId: friendship ? friendship._id : null
      };
    });

    return res.json({ success: true, users: formatted });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

module.exports = router;
