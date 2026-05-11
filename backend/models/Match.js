const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    student1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    student2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    course: String,

    level: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);