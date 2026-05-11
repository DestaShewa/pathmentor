const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },

  options: [{
    type: String,
    required: true
  }],

  correctAnswer: {
    type: Number, // index of correct option
    required: true
  }

});

const quizSchema = new mongoose.Schema({

  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true
  },

  questions: [questionSchema]

}, { timestamps: true });

module.exports = mongoose.model("Quiz", quizSchema);