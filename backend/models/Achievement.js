const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  title: {
    type: String,
    required: true
  },

  description: String,

  icon: String,

  earnedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Achievement", achievementSchema);
