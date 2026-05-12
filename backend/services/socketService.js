const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// Store active socket connections
const userSockets = new Map(); // userId -> Set of socket IDs
const socketUsers = new Map(); // socket ID -> userId

// Typing timeouts
const typingTimeouts = new Map();

const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
      
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name email role");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Authentication error"));
    }
  });
  
  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);
    
    // Track user socket
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socketUsers.set(socket.id, userId);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Update user online status
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    });
    
    // Broadcast online status to all users who have conversations with this user
    const conversations = await Conversation.find({
      participants: userId
    }).select("participants");
    
    for (const conv of conversations) {
      for (const participantId of conv.participants) {
        if (participantId.toString() !== userId) {
          io.to(`user:${participantId}`).emit("user_online", {
            userId,
            isOnline: true
          });
        }
      }
    }
    
    // ========== JOIN CONVERSATION ==========
    socket.on("join_conversation", async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }
        
        socket.join(`conversation:${conversationId}`);
        console.log(`📨 User ${userId} joined conversation ${conversationId}`);
        
        // Mark messages as delivered
        const undeliveredMessages = await Message.find({
          conversation: conversationId,
          sender: { $ne: userId },
          "deliveredTo.user": { $ne: userId }
        });
        
        for (const msg of undeliveredMessages) {
          await msg.markAsDelivered(userId);
        }
        
        // Notify sender of delivery
        if (undeliveredMessages.length > 0) {
          const senderIds = [...new Set(undeliveredMessages.map(m => m.sender.toString()))];
          for (const senderId of senderIds) {
            io.to(`user:${senderId}`).emit("messages_delivered", {
              conversationId,
              userId
            });
          }
        }
      } catch (error) {
        console.error("Join conversation error:", error);
        socket.emit("error", { message: error.message });
      }
    });
    
    // ========== LEAVE CONVERSATION ==========
    socket.on("leave_conversation", (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 User ${userId} left conversation ${conversationId}`);
    });
    
    // ========== SEND MESSAGE (Real-time) ==========
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, message, messageType = "text", tempId } = data;
        
        if (!conversationId || !message) {
          socket.emit("error", { message: "conversationId and message are required" });
          return;
        }
        
        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }
        
        // Create message
        const newMessage = new Message({
          conversation: conversationId,
          sender: userId,
          message,
          messageType
        });
        
        await newMessage.save();
        await newMessage.populate("sender", "name email avatar role");
        
        // Update conversation
        conversation.lastMessage = newMessage._id;
        conversation.lastMessageAt = new Date();
        
        // Increment unread for other participants
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== userId) {
            await conversation.incrementUnread(participantId);
          }
        }
        
        // Remove typing indicator
        await conversation.removeTypingUser(userId);
        await conversation.save();
        
        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit("new_message", {
          conversationId,
          message: newMessage,
          tempId // For optimistic UI updates
        });
        
        // Emit conversation update to all participants
        for (const participantId of conversation.participants) {
          io.to(`user:${participantId}`).emit("conversation_updated", {
            conversationId,
            lastMessage: newMessage,
            lastMessageAt: conversation.lastMessageAt,
            unreadCount: conversation.unreadCount.get(participantId.toString()) || 0
          });
        }
        
        // Notify other participants (for push notifications)
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== userId) {
            io.to(`user:${participantId}`).emit("new_message_notification", {
              conversationId,
              sender: socket.user,
              message: newMessage.message,
              messageType: newMessage.messageType
            });
          }
        }
        
        console.log(`💬 Message sent in conversation ${conversationId} by ${userId}`);
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: error.message });
      }
    });
    
    // ========== TYPING INDICATOR ==========
    socket.on("typing_start", async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) return;
        
        await conversation.addTypingUser(userId);
        
        // Clear existing timeout
        const timeoutKey = `${userId}:${conversationId}`;
        if (typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingTimeouts.get(timeoutKey));
        }
        
        // Set new timeout to auto-stop typing after 3 seconds
        const timeout = setTimeout(async () => {
          await conversation.removeTypingUser(userId);
          socket.to(`conversation:${conversationId}`).emit("typing_stop", {
            conversationId,
            userId
          });
          typingTimeouts.delete(timeoutKey);
        }, 3000);
        
        typingTimeouts.set(timeoutKey, timeout);
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit("typing_start", {
          conversationId,
          userId,
          userName: socket.user.name
        });
      } catch (error) {
        console.error("Typing start error:", error);
      }
    });
    
    socket.on("typing_stop", async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) return;
        
        await conversation.removeTypingUser(userId);
        
        // Clear timeout
        const timeoutKey = `${userId}:${conversationId}`;
        if (typingTimeouts.has(timeoutKey)) {
          clearTimeout(typingTimeouts.get(timeoutKey));
          typingTimeouts.delete(timeoutKey);
        }
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit("typing_stop", {
          conversationId,
          userId
        });
      } catch (error) {
        console.error("Typing stop error:", error);
      }
    });
    
    // ========== MARK AS READ ==========
    socket.on("mark_as_read", async (data) => {
      try {
        const { conversationId } = data;
        
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) return;
        
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
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          userId
        });
        
        // Update conversation list for current user
        io.to(`user:${userId}`).emit("conversation_updated", {
          conversationId,
          unreadCount: 0
        });
      } catch (error) {
        console.error("Mark as read error:", error);
      }
    });
    
    // ========== DISCONNECT ==========
    socket.on("disconnect", async () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${userId}) - Socket: ${socket.id}`);
      
      // Remove socket from tracking
      if (userSockets.has(userId)) {
        userSockets.get(userId).delete(socket.id);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
          
          // Update user offline status (only if no other sockets)
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          
          // Broadcast offline status
          const conversations = await Conversation.find({
            participants: userId
          }).select("participants");
          
          for (const conv of conversations) {
            for (const participantId of conv.participants) {
              if (participantId.toString() !== userId) {
                io.to(`user:${participantId}`).emit("user_offline", {
                  userId,
                  isOnline: false,
                  lastSeen: new Date()
                });
              }
            }
          }
        }
      }
      socketUsers.delete(socket.id);
      
      // Clear any typing timeouts
      for (const [key, timeout] of typingTimeouts.entries()) {
        if (key.startsWith(`${userId}:`)) {
          clearTimeout(timeout);
          typingTimeouts.delete(key);
        }
      }
    });
  });
  
  console.log("🚀 Socket.IO service initialized");
};

// Helper function to get online users
const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

// Helper function to check if user is online
const isUserOnline = (userId) => {
  return userSockets.has(userId.toString());
};

module.exports = {
  initializeSocket,
  getOnlineUsers,
  isUserOnline
};
