const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  type: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  meta: {
    type: Object // optional extra data
  }

}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);