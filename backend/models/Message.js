const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["document", "image", "audio", "video"],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  filename: String,
  size: Number,
  mimeType: String,
  duration: Number // For audio/video in seconds
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Legacy support - will be deprecated
    roomId: String,

    message: {
      type: String,
      required: true
    },

    messageType: {
      type: String,
      enum: ["text", "document", "audio", "image", "video"],
      default: "text"
    },

    attachments: [attachmentSchema],

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },

    isEdited: {
      type: Boolean,
      default: false
    },

    deletedAt: Date,

    // Read receipts - array of user IDs who have read this message
    readBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now }
    }],
    
    // Delivery status
    deliveredTo: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deliveredAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ roomId: 1, createdAt: 1 }); // Legacy support

// Method to mark as read by a user
messageSchema.methods.markAsRead = async function(userId) {
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  if (!alreadyRead && this.sender.toString() !== userId.toString()) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
};

// Method to mark as delivered to a user
messageSchema.methods.markAsDelivered = async function(userId) {
  const alreadyDelivered = this.deliveredTo.some(d => d.user.toString() === userId.toString());
  if (!alreadyDelivered && this.sender.toString() !== userId.toString()) {
    this.deliveredTo.push({ user: userId, deliveredAt: new Date() });
    await this.save();
  }
};

module.exports = mongoose.model("Message", messageSchema);
