const Level = require("../models/Level");
const Progress = require("../models/Progress");
const Lesson = require("../models/Lesson");
const asyncHandler = require("../middleware/asyncHandler");

// GET /api/levels/course/:courseId
exports.getLevelsByTrack = asyncHandler(async (req, res) => {
  const levels = await Level.find({ course: req.params.courseId }).sort({ order: 1 });
  res.json({ success: true, data: levels });
});

// GET /api/levels/:courseId/unlock-status
exports.getUnlockStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const courseId = req.params.courseId;

  const levels = await Level.find({ course: courseId }).sort({ order: 1 }).lean();

  const progress = await Progress.findOne({ user: userId, course: courseId });

  let unlocked = true;

  for (let level of levels) {
    const levelProgress = progress?.levelsProgress?.find(
      lp => lp.level.toString() === level._id.toString()
    );

    const totalLessons = await Lesson.countDocuments({ level: level._id });
    const completedCount = levelProgress?.completedLessons?.length || 0;
    const score = levelProgress?.score || 0;

    level.isUnlocked = unlocked;
    level.score = score;
    level.completedLessons = completedCount;
    level.totalLessons = totalLessons;

    // Next level only unlocks if all lessons done AND score >= 80
    if (totalLessons === 0 || !(completedCount >= totalLessons && score >= 80)) {
      unlocked = false;
    }
  }

  res.json({ success: true, levels });
});
