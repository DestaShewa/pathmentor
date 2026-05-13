const express = require("express");
const router = express.Router();

const { 
  createCourse, 
  getCourseRoadmap, 
  getAllCourses, 
  enrollInCourse 
} = require("../controllers/courseController");

const { guard, authorize } = require("../middleware/authMiddleware");

// GET all courses (for students to browse)
router.get("/", getAllCourses);

// GET course categories for registration — returns unique categories + course titles
router.get("/categories", async (req, res) => {
  try {
    const Course = require("../models/Course");
    const User = require("../models/User");

    // Only include courses created by admin users
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id);

    const courses = await Course.find({ createdBy: { $in: adminIds } }, "title category").sort({ title: 1 });

    // Build unique categories with their courses
    const categoryMap = {};
    courses.forEach((c) => {
      const cat = c.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push({ _id: c._id, title: c.title });
    });

    const categories = Object.entries(categoryMap).map(([name, courses]) => ({
      name,
      courses,
    }));

    res.json({ success: true, data: categories, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get course roadmap
router.get("/:id/roadmap", getCourseRoadmap);

// Enroll in course (students only)
router.post("/:id/enroll", guard, authorize("student"), enrollInCourse);

// Create course (mentor/admin only)
router.post("/", guard, authorize("mentor","admin"), createCourse);

module.exports = router;