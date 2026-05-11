const Announcement = require("../models/Announcement");
const asyncHandler = require("../middleware/asyncHandler");
const { validationResult } = require("express-validator");

// POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, message, course, category, imageUrl, link, expiresAt } = req.body;

  const announcement = await Announcement.create({
    title,
    message,
    course: course || undefined,
    category: category || "General",
    imageUrl: imageUrl || undefined,
    link: link || undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    createdBy: req.user._id,
    role: req.user.role
  });

  res.status(201).json({ success: true, data: announcement });
});

// GET /api/announcements  (optional ?category=)
const getAnnouncements = asyncHandler(async (req, res) => {
  const { category } = req.query;

  const query = {
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };

  if (category && category !== "All") {
    query.category = category;
  }

  const announcements = await Announcement.find(query)
    .populate("createdBy", "name")
    .populate("course", "title")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: announcements });
});

// GET /api/announcements/course/:courseId
const getCourseAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({
    course: req.params.courseId,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: announcements });
});

// PUT /api/announcements/:id/bookmark
const toggleBookmark = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ message: "Announcement not found" });
  }

  const userId = req.user._id.toString();
  const bookmarked = announcement.bookmarkedBy || [];
  const isBookmarked = bookmarked.some(id => id.toString() === userId);

  if (isBookmarked) {
    announcement.bookmarkedBy = bookmarked.filter(id => id.toString() !== userId);
  } else {
    announcement.bookmarkedBy.push(req.user._id);
  }

  await announcement.save();

  res.json({
    success: true,
    bookmarked: !isBookmarked,
    message: isBookmarked ? "Bookmark removed" : "Announcement bookmarked"
  });
});

// GET /api/announcements/bookmarks
const getMyBookmarks = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({
    bookmarkedBy: req.user._id
  })
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: announcements });
});

// DELETE /api/announcements/:id
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    return res.status(404).json({ success: false, message: "Announcement not found" });
  }

  await Announcement.findByIdAndDelete(req.params.id);

  res.json({ success: true, message: "Announcement deleted successfully" });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getCourseAnnouncements,
  toggleBookmark,
  getMyBookmarks,
  deleteAnnouncement
};
