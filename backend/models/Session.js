const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    date: Date,

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    meetingLink: String,
    summary: String,
    feedback: String,

    // Student rating after session
    studentRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    studentComment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
