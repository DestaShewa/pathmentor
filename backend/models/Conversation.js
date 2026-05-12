const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    
    type: {
      type: String,
      enum: ["direct", "study_buddy"],
      default: "direct"
    },
    
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    
    // Unread count per participant
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },
    
    // Typing status per participant
    typingUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    
    // For study buddy conversations - link to match
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match"
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(participant1, participant2, type = "direct", matchId = null) {
  const participants = [participant1, participant2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants,
      type,
      matchId,
      unreadCount: {
        [participant1]: 0,
        [participant2]: 0
      }
    });
  }
  
  return conversation;
};

// Method to increment unread count for a user
conversationSchema.methods.incrementUnread = async function(userId) {
  const userIdStr = userId.toString();
  const currentCount = this.unreadCount.get(userIdStr) || 0;
  this.unreadCount.set(userIdStr, currentCount + 1);
  await this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = async function(userId) {
  const userIdStr = userId.toString();
  this.unreadCount.set(userIdStr, 0);
  await this.save();
};

// Method to add typing user
conversationSchema.methods.addTypingUser = async function(userId) {
  if (!this.typingUsers.includes(userId)) {
    this.typingUsers.push(userId);
    await this.save();
  }
};

// Method to remove typing user
conversationSchema.methods.removeTypingUser = async function(userId) {
  this.typingUsers = this.typingUsers.filter(id => id.toString() !== userId.toString());
  await this.save();
};

module.exports = mongoose.model("Conversation", conversationSchema);
