const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  url:      { type: String, required: true },
  type:     { type: String, required: true }, // "pdf" | "doc" | "image" | "video" | "audio" | "other"
  mimeType: { type: String },
  size:     { type: Number }, // bytes
}, { _id: false });

const lessonSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: String,
    content:     String,

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    order: { type: Number, default: 1 },

    // Video embed URL (YouTube, Vimeo, etc.)
    videoUrl: String,

    // Uploaded images (stored paths)
    images: [String],

    // All uploaded files (PDF, DOC, video files, images, etc.)
    attachments: [attachmentSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lesson", lessonSchema);
