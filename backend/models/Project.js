const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt:  { type: Date, default: Date.now },
  description:  String,
  fileUrl:      String,
  link:         String,
  grade:        { type: String },          // e.g. "A", "B+", "85%"
  feedback:     String,
  status:       { type: String, enum: ["submitted", "reviewed", "revision_needed"], default: "submitted" }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  instructions: String,
  dueDate:      Date,
  mentor:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // Assigned to specific students (mentor's assigned students)
  assignedTo:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // Optional: link to a course
  course:       { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  attachments:  [{ name: String, url: String }],
  submissions:  [submissionSchema],
  status:       { type: String, enum: ["active", "closed"], default: "active" }
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
