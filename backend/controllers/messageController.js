const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Helper to determine attachment type from mimetype
const getAttachmentType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.startsWith("video/")) return "video";
  return "document";
};

// GET /api/messages/room/:roomId
// @deprecated - Use GET /api/conversations/:conversationId/messages instead
exports.getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: "roomId is required" });

    // Try to find messages by conversation.roomId first (modern), then fall back to legacy roomId field
    const conversation = await Conversation.findOne({ roomId });
    let messages;
    if (conversation) {
      messages = await Message.find({ conversation: conversation._id, deletedAt: null })
        .sort({ createdAt: 1 })
        .populate("sender", "name email role")
        .populate("replyTo", "message sender");
    } else {
      messages = await Message.find({ roomId, deletedAt: null })
        .sort({ createdAt: 1 })
        .populate("sender", "name email role")
        .populate("replyTo", "message sender");
    }
      
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages
// @deprecated - Use POST /api/conversations/:conversationId/messages instead
exports.createMessage = async (req, res) => {
  try {
    const { roomId, message, messageType, replyTo } = req.body;
    const sender = req.user ? req.user._id : null;

    if (!roomId) return res.status(400).json({ message: "roomId is required" });
    
    // Either message text or attachments must be present
    if (!message && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Message text or attachments required" });
    }

    // Auto-resolve a Conversation from roomId (required by Message model)
    const conversation = await Conversation.findOrCreateByRoomId(roomId, sender);

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

    const newMsg = new Message({
      conversation: conversation._id,
      roomId,
      message: message || "",
      messageType: messageType || (attachments.length > 0 ? attachments[0].type : "text"),
      attachments,
      sender,
      replyTo: replyTo || undefined
    });
    
    await newMsg.save();

    // Populate sender info for response
    await newMsg.populate("sender", "name email role");
    if (newMsg.replyTo) {
      await newMsg.populate("replyTo", "message sender");
    }

    // Emit over socket.io if available
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(roomId).emit("newMessage", newMsg);
    }

    res.status(201).json({ message: newMsg });
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/messages/:id - Edit message
exports.editMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const msg = await Message.findById(req.params.id);
    
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    msg.message = message;
    msg.isEdited = true;
    await msg.save();
    
    await msg.populate("sender", "name email role");
    
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(msg.roomId).emit("messageEdited", msg);
    }
    
    res.json({ message: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/messages/:id - Soft delete message
exports.deleteMessage = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    
    if (!msg) return res.status(404).json({ message: "Message not found" });
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    msg.deletedAt = new Date();
    await msg.save();
    
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(msg.roomId).emit("messageDeleted", { messageId: msg._id });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/messages/room/:roomId - Delete entire conversation (admin only)
exports.deleteConversation = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Soft delete all messages in room
    await Message.updateMany(
      { roomId, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(roomId).emit("conversationDeleted", { roomId });
    }
    
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages/:id/read - Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message not found" });
    
    // Check if already read by this user
    const alreadyRead = msg.readBy.some(r => r.user.toString() === req.user._id.toString());
    if (!alreadyRead) {
      msg.readBy.push({ user: req.user._id, readAt: new Date() });
      await msg.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/messages/unread-count - Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all messages where user is not the sender and hasn't read
    const count = await Message.countDocuments({
      sender: { $ne: userId },
      deletedAt: null,
      "readBy.user": { $ne: userId }
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
