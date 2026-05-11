const express = require("express");
const router = express.Router();
const { guard } = require("../middleware/authMiddleware");

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} = require("../controllers/notificationController");

// Get all notifications for logged-in user
router.get("/", guard, getUserNotifications);

// Get unread count
router.get("/unread-count", guard, getUnreadCount);

// Mark all as read
router.put("/read-all", guard, markAllAsRead);

// Mark single notification as read
router.put("/:id/read", guard, markAsRead);

// Delete notification
router.delete("/:id", guard, deleteNotification);

module.exports = router;
