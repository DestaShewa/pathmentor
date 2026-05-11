const express = require("express");
const router = express.Router();

const { guard, authorize } = require("../middleware/authMiddleware");

const { createLesson, getLessonsByLevel } = require("../controllers/lessonController");

router.post("/", guard, authorize("mentor","admin"), createLesson);

router.get("/level/:levelId", getLessonsByLevel);

module.exports = router;