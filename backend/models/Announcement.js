const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  role: {
    type: String,
    enum: ["admin", "mentor"],
    required: true
  },

  category: {
    type: String,
    enum: ["General", "Events", "Internship", "Hackathon", "News"],
    default: "General"
  },

  imageUrl: {
    type: String
  },

  link: {
    type: String
  },

  expiresAt: {
    type: Date
  },

  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);
