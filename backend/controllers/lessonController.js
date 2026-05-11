const Lesson = require("../models/Lesson");
const Progress = require("../models/Progress");
const Level = require("../models/Level");
const asyncHandler = require("../middleware/asyncHandler");
const { logActivity } = require("../utils/activityLogger");

// POST /api/lessons
const createLesson = asyncHandler(async (req, res) => {
  const level = await Level.findById(req.body.levelId);
  if (!level) {
    res.status(404);
    throw new Error("Level not found");
  }

  const lesson = await Lesson.create({
    title: req.body.title,
    description: req.body.description,
    content: req.body.content,
    videoUrl: req.body.videoUrl,
    order: req.body.order || 1,
    level: req.body.levelId,
    course: req.body.courseId,
    createdBy: req.user._id
  });

  // Non-blocking log
  logActivity({
    user: req.user._id,
    type: "LESSON_CREATED",
    message: `Lesson "${lesson.title}" added`
  }).catch(() => {});

  res.status(201).json({ success: true, data: lesson });
});

// GET /api/lessons/level/:levelId
const getLessonsByLevel = asyncHandler(async (req, res) => {
  const levelId = req.params.levelId;

  const level = await Level.findById(levelId);
  if (!level) {
    res.status(404);
    throw new Error("Level not found");
  }

  // Level 1 (order === 1) is always accessible
  if (level.order !== 1) {
    // Find the previous level
    const prevLevel = await Level.findOne({
      course: level.course,
      order: level.order - 1
    });

    if (prevLevel) {
      const prevLessonCount = await Lesson.countDocuments({ level: prevLevel._id });

      // Only enforce lock if the previous level actually has lessons
      if (prevLessonCount > 0) {
        const progress = await Progress.findOne({
          user: req.user._id,
          course: level.course
        });

        const prevLevelProgress = progress?.levelsProgress?.find(
          lp => lp.level.toString() === prevLevel._id.toString()
        );

        if (!prevLevelProgress?.isCompleted) {
          res.status(403);
          throw new Error("Level locked. Complete the previous level first.");
        }
      }
    }
  }

  const lessons = await Lesson.find({ level: levelId }).sort({ order: 1 });
  res.json({ success: true, data: lessons });
});

// Admin: GET all lessons
const adminGetLessons = asyncHandler(async (req, res) => {
  const lessons = await Lesson.find()
    .populate("course", "title")
    .populate("level", "title order")
    .sort({ createdAt: -1 });
  res.json(lessons);
});

// Admin: DELETE lesson
const adminDeleteLesson = asyncHandler(async (req, res) => {
  await Lesson.findByIdAndDelete(req.params.id);
  res.json({ message: "Lesson deleted" });
});

module.exports = { createLesson, getLessonsByLevel, adminGetLessons, adminDeleteLesson };
