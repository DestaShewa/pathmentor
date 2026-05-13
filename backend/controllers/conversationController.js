const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Match = require("../models/Match");

// Get all conversations for current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate("participants", "name email avatar role learningProfile lastSeen isOnline")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name"
        }
      })
      .sort({ lastMessageAt: -1 });

    // Format conversations with other participant info
    const formatted = conversations.map(conv => {
      const otherParticipant = conv.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      return {
        _id: conv._id,
        participant: otherParticipant,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount.get(userId.toString()) || 0,
        isTyping: conv.typingUsers.some(id => id.toString() !== userId.toString()),
        type: conv.type,
        createdAt: conv.createdAt
      };
    });

    // Add Assigned Students who don't have a conversation yet (for mentors)
    if (req.user.role === "mentor") {
      const assignedStudents = await User.find({ assignedMentor: userId, role: "student" })
        .select("name email avatar role learningProfile lastSeen isOnline");

      const existingParticipantIds = new Set(formatted.filter(c => c.participant).map(c => c.participant._id.toString()));

      for (const student of assignedStudents) {
        if (!existingParticipantIds.has(student._id.toString())) {
          formatted.push({
            _id: `virtual-${student._id}`,
            participant: student,
            lastMessage: null,
            lastMessageAt: null,
            unreadCount: 0,
            isTyping: false,
            type: "direct",
            createdAt: student.createdAt,
            isVirtual: true
          });
        }
      }
    }

    res.json({ success: true, conversations: formatted });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get or create conversation with another user
exports.getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId, type = "direct" } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // For study buddy conversations, check if match exists and is accepted
    if (type === "study_buddy") {
      const match = await Match.findOne({
        $or: [
          { student1: userId, student2: otherUserId },
          { student1: otherUserId, student2: userId }
        ],
        status: "accepted"
      });

      if (!match) {
        return res.status(403).json({
          message: "Study buddy connection must be accepted before chatting"
        });
      }
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(
      userId,
      otherUserId,
      type
    );

    // Populate for response
    await conversation.populate("participants", "name email avatar role learningProfile lastSeen isOnline");

    const otherParticipant = conversation.participants.find(
      p => p._id.toString() !== userId.toString()
    );

    res.json({
      success: true,
      conversation: {
        _id: conversation._id,
        participant: otherParticipant,
        type: conversation.type,
        createdAt: conversation.createdAt
      }
    });
  } catch (error) {
    console.error("Get/create conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Get messages
    const messages = await Message.find({
      conversation: conversationId,
      deletedAt: null
    })
      .populate("sender", "name email avatar role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Mark messages as read
    const unreadMessages = messages.filter(
      msg => msg.sender.toString() !== userId.toString() &&
        !msg.readBy.some(r => r.user.toString() === userId.toString())
    );

    for (const msg of unreadMessages) {
      await msg.markAsRead(userId);
    }

    // Reset unread count
    await conversation.resetUnread(userId);

    res.json({
      success: true,
      messages: messages.reverse(),
      page: parseInt(page),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId: bodyConvId, message, messageType = "text", replyTo } = req.body;
    const conversationId = req.params.conversationId || bodyConvId;

    if (!conversationId || !message) {
      return res.status(400).json({ message: "conversationId and message are required" });
    }

    // Check if user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Process attachments if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          type: getAttachmentType(file.mimetype),
          url: `/uploads/chat/${file.filename}`,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        });
      }
    }

    // Create message
    const newMessage = new Message({
      conversation: conversationId,
      sender: userId,
      message,
      messageType: messageType || (attachments.length > 0 ? attachments[0].type : "text"),
      attachments,
      replyTo: replyTo || undefined
    });

    await newMessage.save();
    await newMessage.populate("sender", "name email avatar role");

    // Update conversation
    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();

    // Increment unread for other participants
    for (const participantId of conversation.participants) {
      if (participantId.toString() !== userId.toString()) {
        await conversation.incrementUnread(participantId);
      }
    }

    await conversation.save();

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit("new_message", {
        conversationId,
        message: newMessage
      });

      // Emit conversation update to all participants
      for (const participantId of conversation.participants) {
        io.to(`user:${participantId}`).emit("conversation_updated", {
          conversationId,
          lastMessage: newMessage,
          lastMessageAt: conversation.lastMessageAt
        });
      }
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark conversation as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mark all unread messages as read
    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      "readBy.user": { $ne: userId }
    });

    for (const msg of unreadMessages) {
      await msg.markAsRead(userId);
    }

    // Reset unread count
    await conversation.resetUnread(userId);

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("messages_read", {
        conversationId,
        userId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Hard delete all messages in this conversation
    await Message.deleteMany({ conversation: conversationId });

    // Hard delete the conversation itself
    await Conversation.findByIdAndDelete(conversationId);

    // Emit socket event
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("conversation_deleted", {
        conversationId
      });
    }

    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function
const getAttachmentType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  return "document";
};
