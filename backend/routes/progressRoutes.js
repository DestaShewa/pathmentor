const express = require("express");
const router = express.Router();
const { guard, authorize } = require("../middleware/authMiddleware");

const {
  completeLesson,
  updateLevelScore,
  getCourseProgress,
  getUserXP,
  getUserAchievements,
  getUserStreak,
  getDailyMotivation,
  getWeeklyReport,
  getSmartReminder
} = require("../controllers/progressController");

router.post("/lesson/:id/complete", guard, authorize("student"), completeLesson);
router.post("/level/score", guard, authorize("student"), updateLevelScore);
router.get("/course/:courseId", guard, getCourseProgress);
router.get("/xp", guard, getUserXP);
router.get("/achievements", guard, getUserAchievements);
router.get("/streak", guard, getUserStreak);
router.get("/motivation", guard, getDailyMotivation);
router.get("/weekly-report", guard, getWeeklyReport);
router.get("/reminder", guard, getSmartReminder);

module.exports = router;
