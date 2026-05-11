const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

     description: {
    type: String,
    required: true
  },

  category: {
    type: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // levels: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Level"
  // }]

}, { timestamps: true });
module.exports = mongoose.model("Course", courseSchema);