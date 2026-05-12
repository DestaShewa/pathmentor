const express = require("express");
const router = express.Router();
const { 
  getMessagesByRoom, 
  createMessage, 
  editMessage, 
  deleteMessage,
  deleteConversation,
  markAsRead,
  getUnreadCount
} = require("../controllers/messageController");
const { guard, authorize } = require("../middleware/authMiddleware");
const { chatUpload } = require("../middleware/uploadMiddleware");

// Get messages for a room
router.get("/room/:roomId", guard, getMessagesByRoom);

// Create new message (with optional attachments)
router.post("/", guard, chatUpload.array("attachments", 5), createMessage);

// Edit message
router.put("/:id", guard, editMessage);

// Delete single message
router.delete("/:id", guard, deleteMessage);

// Delete entire conversation (admin only)
router.delete("/room/:roomId", guard, authorize("admin"), deleteConversation);

// Mark message as read
router.post("/:id/read", guard, markAsRead);

// Get unread count
router.get("/unread-count", guard, getUnreadCount);

module.exports = router;
