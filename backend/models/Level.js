const mongoose = require("mongoose");
const levelSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  order: {
    type: Number,
    required: true
  }, //help with level unlocking logic

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },

  // lessons: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Lesson"
  // }]

}, { timestamps: true });

module.exports = mongoose.model("Level", levelSchema);
