const Progress = require("../models/Progress");
const Lesson = require("../models/Lesson");
const Level = require("../models/Level");
const Achievement = require("../models/Achievement");
const Course = require("../models/Course");
const User = require("../models/User");
const DailyProgress = require("../models/DailyProgress");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");



/*
========================================
XP CALCULATION
========================================
*/
const getXPForLevel = (levelTitle) => {
  const xpMap = {
    Awareness: 5,
    Beginner: 10,
    Fundamental: 15,
    Intermediate: 20,
    Advanced: 30,
    Proficient: 40,
    Mastery: 50
  };

  return xpMap[levelTitle] || 5;
};



/*
========================================
PREVENT DUPLICATE ACHIEVEMENTS
========================================
*/
const createAchievementIfNotExists = async (userId, title, description) => {

  const exists = await Achievement.findOne({
    user: userId,
    title
  });

  if (!exists) {
    const achievement = await Achievement.create({
      user: userId,
      title,
      description
    });

    // Send notification
    await createNotification({
      userId,
      type: "achievement",
      title: "New Achievement Unlocked! 🎉",
      message: `You earned "${title}": ${description}`,
      link: "/achievements",
      icon: "trophy"
    });

    return achievement;
  }

  return null;
};



/*
========================================
CHECK ACHIEVEMENTS
========================================
*/
const checkAchievements = async (userId, progress) => {

  let totalCompletedLessons = 0;

  progress.levelsProgress.forEach(lp => {
    totalCompletedLessons += lp.completedLessons.length;
  });
  const totalLevels = progress.levelsProgress.length;

  const completedLevels = progress.levelsProgress.filter(
    lp => lp.isCompleted
  ).length;

  if (totalLevels > 0 && completedLevels === totalLevels) {
    await createAchievementIfNotExists(
      userId,
      "Course Completed",
      "You completed a full course"
    );
  }

  // const completedLevels = progress.levelsProgress.filter(lp => lp.isCompleted).length;
  const totalXP = progress.xpEarned;

  // 🎯 Achievements

  if (totalCompletedLessons === 1) {
    await createAchievementIfNotExists(userId, "First Step", "Completed your first lesson");
  }

  if (totalCompletedLessons === 5) {
    await createAchievementIfNotExists(userId, "Fast Learner", "Completed 5 lessons");
  }

  if (completedLevels === 1) {
    await createAchievementIfNotExists(userId, "Level Up", "Completed your first level");
  }

  if (completedLevels === 3) {
    await createAchievementIfNotExists(userId, "Level Master", "Completed 3 levels");
  }

  const highScoreLevel = progress.levelsProgress.find(lp => lp.score >= 90);

  if (highScoreLevel) {
    await createAchievementIfNotExists(userId, "High Performer", "Scored 90% or more in a level");
  }

  if (totalXP >= 100) {
    await createAchievementIfNotExists(userId, "XP Starter", "Earned 100 XP");
  }

  const perfectScoreLevel = progress.levelsProgress.find(
    lp => lp.score === 100
  );

  if (perfectScoreLevel) {
    await createAchievementIfNotExists(
      userId,
      "Perfect Score",
      "Achieved 100% in a level"
    );
  }


};



/*
========================================
COMPLETE LESSON
POST /api/progress/lesson/:id/complete
Body: { timeSpentSeconds: number }  — client must send actual time spent
Unlock rules:
  - Lesson 1 of a level (order === 1): always completable after 30s engagement
  - Subsequent lessons: previous lesson must be completed
  - Level unlock: ALL lessons done AND quiz score >= 80%
========================================
*/
const completeLesson = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const lessonId = req.params.id;
  const { timeSpentSeconds = 0 } = req.body;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found");
  }

  const level = await Level.findById(lesson.level);
  if (!level) {
    res.status(404);
    throw new Error("Level not found");
  }

  // ── Minimum engagement check ──────────────────────────────────
  // Require at least 30 seconds of engagement before marking complete
  const MIN_ENGAGEMENT_SECONDS = 30;
  if (timeSpentSeconds < MIN_ENGAGEMENT_SECONDS) {
    return res.status(400).json({
      success: false,
      message: `Please spend at least ${MIN_ENGAGEMENT_SECONDS} seconds on this lesson before completing it.`,
      required: MIN_ENGAGEMENT_SECONDS,
      provided: timeSpentSeconds,
    });
  }

  // ── Check level is unlocked for this student ──────────────────
  let progress = await Progress.findOne({ user: userId, course: lesson.course });

  if (!progress) {
    // First lesson of first level — create progress
    if (level.order === 1) {
      progress = await Progress.create({
        user: userId,
        course: lesson.course,
        levelsProgress: [],
        xpEarned: 0,
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "You must complete the previous level first.",
      });
    }
  }

  // Check if this level is accessible:
  // Level 1 is always accessible.
  // Level N requires level N-1 to be completed (isCompleted = true AND score >= 80)
  if (level.order > 1) {
    const prevLevels = await Level.find({ course: lesson.course, order: level.order - 1 });
    const prevLevel = prevLevels[0];
    if (prevLevel) {
      const prevLevelProgress = progress.levelsProgress.find(
        (lp) => lp.level.toString() === prevLevel._id.toString()
      );
      if (!prevLevelProgress || !prevLevelProgress.isCompleted || prevLevelProgress.score < 80) {
        return res.status(403).json({
          success: false,
          message: "Complete the previous level with a quiz score of 80% or higher to unlock this level.",
        });
      }
    }
  }

  // ── Check lesson order within level ──────────────────────────
  // Lessons must be completed in order (lesson.order > 1 requires previous lesson done)
  if (lesson.order > 1) {
    const prevLessons = await Lesson.find({
      level: lesson.level,
      order: lesson.order - 1,
    });
    const prevLesson = prevLessons[0];
    if (prevLesson) {
      const levelProg = progress.levelsProgress.find(
        (lp) => lp.level.toString() === level._id.toString()
      );
      const prevDone = levelProg?.completedLessons?.some(
        (id) => id.toString() === prevLesson._id.toString()
      );
      if (!prevDone) {
        return res.status(403).json({
          success: false,
          message: "Complete the previous lesson first.",
        });
      }
    }
  }

  const xp = getXPForLevel(level.title);

  // Find or create level progress entry
  let levelProgress = progress.levelsProgress.find(
    (lp) => lp.level.toString() === level._id.toString()
  );

  if (!levelProgress) {
    levelProgress = {
      level: level._id,
      completedLessons: [],
      score: 0,
      isCompleted: false,
    };
    progress.levelsProgress.push(levelProgress);
  }

  // Prevent duplicate lesson completion
  if (levelProgress.completedLessons.some((id) => id.toString() === lessonId)) {
    return res.json({
      success: true,
      message: "Lesson already completed",
      totalXP: progress.xpEarned,
    });
  }

  // Mark lesson complete
  levelProgress.completedLessons.push(lessonId);
  progress.xpEarned += xp;

  await progress.save();

  // ── Update streak ──────────────────────────────────────────────
  const user = await User.findById(userId).select("streak");
  const now = new Date();
  const lastStudied = user.streak?.lastStudiedAt
    ? new Date(user.streak.lastStudiedAt)
    : null;

  // Calculate how many full calendar days since last study
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastMidnight = lastStudied
    ? new Date(lastStudied.getFullYear(), lastStudied.getMonth(), lastStudied.getDate())
    : null;
  const daysDiff = lastMidnight
    ? Math.round((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24))
    : null;

  if (daysDiff === null || daysDiff > 1) {
    // First ever study OR gap of 2+ days — reset streak to 1
    user.streak.current = 1;
  } else if (daysDiff === 1) {
    // Studied yesterday — extend streak
    user.streak.current += 1;
  }
  // daysDiff === 0 means already studied today — don't change current

  // Update longest if needed
  if (user.streak.current > (user.streak.longest || 0)) {
    user.streak.longest = user.streak.current;
  }

  user.streak.lastStudiedAt = now;
  await user.save();
  // ──────────────────────────────────────────────────────────────

  // Check achievements
  await checkAchievements(userId, progress);

  // ── Log daily activity ──────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await DailyProgress.findOneAndUpdate(
      { user: userId, date: today },
      {
        $inc: {
          xp: xp,
          timeSpentSeconds: timeSpentSeconds,
          lessonsCompleted: 1
        }
      },
      { upsert: true }
    );
  } catch (logErr) {
    console.error("Failed to log daily activity:", logErr);
  }
  // ──────────────────────────────────────────────────────────────

  res.json({
    success: true,
    message: "Lesson completed successfully",
    xpEarned: xp,
    totalXP: progress.xpEarned
  });

});



/*
========================================
UPDATE LEVEL SCORE (QUIZ / PROJECT / EXAM)
POST /api/progress/level/score
Level completes ONLY when ALL lessons done AND score >= 80%
========================================
*/
const updateLevelScore = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const { levelId, score, courseId } = req.body;

  if (!levelId || score === undefined) {
    return res.status(400).json({ message: "levelId and score are required" });
  }

  let resolvedCourseId = courseId;
  if (!resolvedCourseId) {
    const level = await Level.findById(levelId);
    if (!level) return res.status(404).json({ message: "Level not found" });
    resolvedCourseId = level.course;
  }

  const progress = await Progress.findOne({ user: userId, course: resolvedCourseId });
  if (!progress) {
    res.status(404);
    throw new Error("Progress not found — enroll in the course first");
  }

  const levelProgress = progress.levelsProgress.find(lp =>
    lp.level.toString() === levelId
  );
  if (!levelProgress) {
    res.status(404);
    throw new Error("Level progress not found — complete at least one lesson first");
  }

  // Keep the highest score
  if (score > levelProgress.score) {
    levelProgress.score = score;
  }

  const totalLessons = await Lesson.countDocuments({ level: levelId });
  const PASS_THRESHOLD = 80;
  const allLessonsDone = levelProgress.completedLessons.length >= totalLessons && totalLessons > 0;
  const quizPassed = levelProgress.score >= PASS_THRESHOLD;

  // Level completes ONLY when all lessons done AND quiz >= 80%
  levelProgress.isCompleted = allLessonsDone && quizPassed;

  await progress.save();
  await checkAchievements(userId, progress);

  res.json({
    success: true,
    message: levelProgress.isCompleted
      ? "Level completed! Next level unlocked."
      : score < PASS_THRESHOLD
        ? `Score ${score}% — need ${PASS_THRESHOLD}% to unlock next level. Try again!`
        : `Score saved. Complete all ${totalLessons} lessons to unlock next level.`,
    levelCompleted: levelProgress.isCompleted,
    score: levelProgress.score,
    passThreshold: PASS_THRESHOLD,
    allLessonsDone,
    quizPassed,
  });

});



/*
========================================
GET COURSE PROGRESS (WITH PERCENTAGE)
GET /api/progress/course/:courseId
========================================
*/
const getCourseProgress = asyncHandler(async (req, res) => {

  const userId = req.user._id;
  const courseId = req.params.courseId;

  const lessons = await Lesson.find({ course: courseId });
  const totalLessons = lessons.length;

  const progress = await Progress.findOne({
    user: userId,
    course: courseId
  });

  let completedLessonsCount = 0;
  let xpEarned = 0;
  const completedLessonIds = [];

  if (progress) {
    progress.levelsProgress.forEach(lp => {
      completedLessonsCount += lp.completedLessons.length;
      lp.completedLessons.forEach(id => completedLessonIds.push(id.toString()));
    });
    xpEarned = progress.xpEarned;
  }

  const progressPercentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessonsCount / totalLessons) * 100);

  res.json({
    success: true,
    totalLessons,
    completedLessons: completedLessonsCount,
    completedLessonIds,
    progressPercentage,
    xpEarned
  });

});



/*
========================================
GET USER TOTAL XP
GET /api/progress/xp
========================================
*/
const getUserXP = asyncHandler(async (req, res) => {

  const progresses = await Progress.find({
    user: req.user._id
  });

  let totalXP = 0;

  progresses.forEach(p => {
    totalXP += p.xpEarned;
  });

  res.json({
    success: true,
    totalXP
  });

});

const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalCourses = await Course.countDocuments();
  res.json({ success: true, totalUsers, totalCourses });
});

/*
========================================
GET USER ACHIEVEMENTS
GET /api/progress/achievements
========================================
*/
const getUserAchievements = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ user: req.user._id }).sort({ earnedAt: -1 });
  res.json({ success: true, data: achievements });
});

/*
========================================
GET USER STREAK
GET /api/progress/streak
========================================
*/
const getUserStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("streak");
  res.json({ success: true, streak: user?.streak || { current: 0, longest: 0 } });
});

/*
========================================
DAILY MOTIVATION ENGINE
GET /api/progress/motivation
========================================
*/
const getDailyMotivation = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("streak");
  const progresses = await Progress.find({ user: userId });

  let totalXP = 0;
  let totalCompletedLessons = 0;
  progresses.forEach(p => {
    totalXP += p.xpEarned;
    p.levelsProgress.forEach(lp => {
      totalCompletedLessons += lp.completedLessons.length;
    });
  });

  const streak = user?.streak?.current || 0;
  const longestStreak = user?.streak?.longest || 0;

  // Generate motivational message
  let message = "Keep learning! You're doing great.";
  let type = "neutral"; // neutral, positive, warning

  if (streak >= 7) {
    message = `🔥 Amazing! ${streak}-day streak! You're on fire!`;
    type = "positive";
  } else if (streak >= 3) {
    message = `Great job! ${streak} days in a row. Keep it up!`;
    type = "positive";
  } else if (streak === 0 && longestStreak > 0) {
    message = `⚠️ Your streak is at risk! Study today to keep your momentum.`;
    type = "warning";
  } else if (totalCompletedLessons >= 10) {
    message = `You've completed ${totalCompletedLessons} lessons! You're making excellent progress.`;
    type = "positive";
  } else if (totalXP >= 100) {
    message = `You've earned ${totalXP} XP! Keep climbing the leaderboard.`;
    type = "positive";
  }

  res.json({
    success: true,
    motivation: {
      message,
      type,
      streak,
      totalXP,
      totalLessons: totalCompletedLessons
    }
  });
});

/*
========================================
WEEKLY GROWTH REPORT
GET /api/progress/weekly-report
========================================
*/
const getWeeklyReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);

  // 1. Fetch real daily activity from DailyProgress
  const dailyLogs = await DailyProgress.find({
    user: userId,
    date: { $gte: oneWeekAgo }
  }).sort({ date: 1 });

  // 2. Fetch achievements earned this week
  const weeklyAchievements = await Achievement.find({
    user: userId,
    earnedAt: { $gte: oneWeekAgo }
  });

  // Calculate totals from daily logs
  let totalXP = 0;
  let totalTimeSeconds = 0;
  let totalLessons = 0;

  dailyLogs.forEach(log => {
    totalXP += log.xp;
    totalTimeSeconds += log.timeSpentSeconds;
    totalLessons += log.lessonsCompleted;
  });

  // 3. Current topics mastered (levels completed this week)
  const progresses = await Progress.find({ user: userId });
  let weeklyCompletedLevels = 0;
  progresses.forEach(p => {
    p.levelsProgress.forEach(lp => {
      if (lp.isCompleted && lp.updatedAt && new Date(lp.updatedAt) >= oneWeekAgo) {
        weeklyCompletedLevels++;
      }
    });
  });

  // Estimate hours if timeSpentSeconds is 0 (fallback for old data)
  let hoursStudied = Math.round((totalTimeSeconds / 3600) * 10) / 10;
  if (hoursStudied === 0 && totalLessons > 0) {
    hoursStudied = Math.round((totalLessons * 0.5) * 10) / 10;
  }

  res.json({
    success: true,
    report: {
      hoursStudied,
      topicsMastered: weeklyCompletedLevels,
      xpEarned: totalXP,
      lessonsCompleted: totalLessons,
      achievementsEarned: weeklyAchievements.length,
      weekStart: oneWeekAgo.toISOString(),
      weekEnd: now.toISOString(),
      dailyLogs: dailyLogs.map(log => ({
        date: log.date,
        xp: log.xp,
        lessons: log.lessonsCompleted
      }))
    }
  });
});

/*
========================================
SMART REMINDER SYSTEM
GET /api/progress/reminder
========================================
*/
const getSmartReminder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId).select("streak updatedAt");

  const streak = user?.streak?.current || 0;
  const lastActivity = user?.updatedAt || new Date();
  const hoursSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60));

  let reminder = null;

  // Streak at risk
  if (streak > 0 && hoursSinceActivity >= 20) {
    reminder = {
      type: "streak_risk",
      message: `⚠️ Your ${streak}-day streak is at risk! Study today to keep it alive.`,
      urgency: "high"
    };
  }
  // Inactive for 2+ days
  else if (hoursSinceActivity >= 48) {
    reminder = {
      type: "inactive",
      message: "You haven't studied in 2 days. Let's get back on track!",
      urgency: "medium"
    };
  }
  // Inactive for 1 day
  else if (hoursSinceActivity >= 24) {
    reminder = {
      type: "daily_nudge",
      message: "Ready to continue your learning journey today?",
      urgency: "low"
    };
  }

  res.json({
    success: true,
    reminder
  });
});

/*
========================================
AI SKILL GAP ANALYSIS
GET /api/progress/skill-gap
========================================
*/
const getAISkillGap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const aiService = require("../services/aiService");

  // 1. Fetch total XP and lessons
  const progresses = await Progress.find({ user: userId });
  let totalXP = 0;
  let totalLessons = 0;
  let completedLevelCount = 0;
  let totalLevels = 0;
  let masteryTopics = [];

  for (const p of progresses) {
    totalXP += p.xpEarned;
    for (const lp of p.levelsProgress) {
      totalLessons += lp.completedLessons.length;
      totalLevels++;
      if (lp.isCompleted) {
        completedLevelCount++;
        const level = await Level.findById(lp.level).select('title');
        if (level) masteryTopics.push(level.title);
      }
    }
  }

  // 2. Fetch study time from daily logs
  const dailyLogs = await DailyProgress.find({ user: userId });
  let totalSeconds = 0;
  dailyLogs.forEach(log => {
    totalSeconds += log.timeSpentSeconds;
  });
  const studyHours = Math.round((totalSeconds / 3600) * 10) / 10;

  // 3. Calculate overall completion % across all joined courses
  const overallCompletion = totalLevels > 0 
    ? Math.round((completedLevelCount / totalLevels) * 100) 
    : 0;

  // 4. Send to AI
  const progressData = {
    lessonCount: totalLessons,
    xp: totalXP,
    completion: overallCompletion,
    studyHours: studyHours || (totalLessons * 0.5), // fallback
    masteryTopics: masteryTopics.slice(-5) // Send last 5 mastered topics
  };

  const analysis = await aiService.analyzeSkillGap(progressData);

  res.json({
    success: true,
    data: analysis.analysis, // Nesting fix based on microservice response
    rawStats: progressData
  });
});

/*
========================================
EXPORT
========================================
*/
module.exports = {
  completeLesson,
  updateLevelScore,
  getCourseProgress,
  getUserXP,
  getPlatformAnalytics,
  getUserAchievements,
  getUserStreak,
  getDailyMotivation,
  getWeeklyReport,
  getSmartReminder,
  getAISkillGap
};
