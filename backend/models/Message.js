const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    roomId: String,

    message: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);