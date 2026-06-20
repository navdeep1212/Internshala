const mongoose = require("mongoose");

const FriendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requesterUid: { type: String, required: true },
  requesterName: { type: String, required: true },
  requesterPhoto: { type: String, default: "/default-avatar.png" },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipientUid: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientPhoto: { type: String, default: "/default-avatar.png" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

// Ensure no duplicate friend requests between same pair
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendshipSchema.index({ requesterUid: 1, status: 1 });
FriendshipSchema.index({ recipientUid: 1, status: 1 });

module.exports = mongoose.model("Friendship", FriendshipSchema);
