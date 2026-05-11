const mongoose = require("mongoose");

const levelProgressSchema = new mongoose.Schema({

  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Level",
    required: true
  },

  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson"
  }],

  score: {
    type: Number,
    default: 0
  },

  isCompleted: {
    type: Boolean,
    default: false
  }

});

const progressSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  levelsProgress: [levelProgressSchema],

  xpEarned: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);
