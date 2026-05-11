const mongoose = require("mongoose");

const studyRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    topic: {
      type: String,
      required: true
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course"
    },

    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level"
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },

    status: {
      type: String,
      enum: ["active", "ended", "scheduled"],
      default: "active"
    },

    scheduledFor: {
      type: Date,
      default: null
    },

    isPublic: {
      type: Boolean,
      default: true
    },

    tags: [String],

    // For tracking active participants (online now)
    activeParticipants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

// Index for efficient queries
studyRoomSchema.index({ status: 1, isPublic: 1, createdAt: -1 });
studyRoomSchema.index({ creator: 1 });
studyRoomSchema.index({ participants: 1 });

module.exports = mongoose.model("StudyRoom", studyRoomSchema);
