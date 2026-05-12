const express = require("express");
const router = express.Router();
const { guard } = require("../middleware/authMiddleware");
const { chatUpload } = require("../middleware/uploadMiddleware");
const conversationCtrl = require("../controllers/conversationController");

// All routes require authentication
router.use(guard);

// Get all conversations for current user
router.get("/", conversationCtrl.getConversations);

// Get or create conversation with another user
router.post("/", conversationCtrl.getOrCreateConversation);

// Get messages for a conversation
router.get("/:conversationId/messages", conversationCtrl.getMessages);

// Send a message (with optional file attachments)
router.post(
  "/:conversationId/messages",
  chatUpload.array("attachments", 5),
  conversationCtrl.sendMessage
);

// Mark conversation as read
router.post("/:conversationId/read", conversationCtrl.markAsRead);

// Delete conversation
router.delete("/:conversationId", conversationCtrl.deleteConversation);

module.exports = router;
