const express = require("express");
const router = express.Router();

const { 
  createCourse, 
  getCourseRoadmap, 
  getAllCourses, 
  enrollInCourse 
} = require("../controllers/courseController");

const { guard, authorize } = require("../middleware/authMiddleware");

// Get all courses (for students to browse)
router.get("/", getAllCourses);

// Get course roadmap
router.get("/:id/roadmap", getCourseRoadmap);

// Enroll in course (students only)
router.post("/:id/enroll", guard, authorize("student"), enrollInCourse);

// Create course (mentor/admin only)
router.post("/", guard, authorize("mentor","admin"), createCourse);

module.exports = router;