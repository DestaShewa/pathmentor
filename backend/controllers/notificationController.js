const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/asyncHandler");

/*
========================================
GET USER NOTIFICATIONS
GET /api/notifications
========================================
*/
const getUserNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, unreadOnly = false } = req.query;
  
  const query = { user: req.user._id };
  if (unreadOnly === "true") {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    read: false
  });

  res.json({
    success: true,
    data: notifications,
    unreadCount
  });
});

/*
========================================
MARK NOTIFICATION AS READ
PUT /api/notifications/:id/read
========================================
*/
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.read = true;
  await notification.save();

  res.json({
    success: true,
    message: "Notification marked as read"
  });
});

/*
========================================
MARK ALL AS READ
PUT /api/notifications/read-all
========================================
*/
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.json({
    success: true,
    message: "All notifications marked as read"
  });
});

/*
========================================
DELETE NOTIFICATION
DELETE /api/notifications/:id
========================================
*/
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  await notification.deleteOne();

  res.json({
    success: true,
    message: "Notification deleted"
  });
});

/*
========================================
CREATE NOTIFICATION (INTERNAL HELPER)
Used by other controllers to create notifications
========================================
*/
const createNotification = async ({
  userId,
  type,
  title,
  message,
  link = null,
  icon = "bell",
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      icon,
      metadata
    });

    // Emit via Socket.io if available
    const io = global.io;
    if (io) {
      io.to(`user-${userId}`).emit("notification", notification);
    }

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
};

/*
========================================
GET UNREAD COUNT
GET /api/notifications/unread-count
========================================
*/
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    read: false
  });

  res.json({
    success: true,
    count
  });
});

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
};
