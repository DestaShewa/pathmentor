const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { guard, authorize } = require("../middleware/authMiddleware");

const {
  createAnnouncement,
  getAnnouncements,
  getCourseAnnouncements,
  toggleBookmark,
  getMyBookmarks,
  deleteAnnouncement
} = require("../controllers/announcementController");

// Create (admin & mentor only) — with validation
router.post(
  "/",
  guard,
  authorize("admin", "mentor"),
  body("title").notEmpty().withMessage("Title is required"),
  body("message").notEmpty().withMessage("Message is required"),
  createAnnouncement
);

// Get all (with optional ?category= filter)
router.get("/", guard, getAnnouncements);

// My bookmarks
router.get("/bookmarks", guard, getMyBookmarks);

// Course-specific
router.get("/course/:courseId", guard, getCourseAnnouncements);

// Bookmark toggle
router.put("/:id/bookmark", guard, toggleBookmark);

// Delete (admin & mentor only)
router.delete("/:id", guard, authorize("admin", "mentor"), deleteAnnouncement);

module.exports = router;
