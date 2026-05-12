const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    student1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    student2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: String,
    level: String,
    // status: pending = request sent, accepted = both can chat, rejected = declined
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    // who sent the request
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);