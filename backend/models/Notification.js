const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: [
        "achievement",
        "session",
        "project",
        "message",
        "announcement",
        "buddy_request",
        "level_unlock",
        "reminder"
      ],
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    link: {
      type: String,
      default: null
    },

    read: {
      type: Boolean,
      default: false,
      index: true
    },

    icon: {
      type: String,
      default: "bell"
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for efficient queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
