const express = require("express");
const router = express.Router();

const { guard, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");

const userCtrl = require("../controllers/userController");
const courseCtrl = require("../controllers/courseController");
const lessonCtrl = require("../controllers/lessonController");
const quizCtrl = require("../controllers/quizController");
const progressCtrl = require("../controllers/progressController");
const leaderboardCtrl = require("../controllers/leaderboardController");
const announcementCtrl = require("../controllers/announcementController");
const activityCtrl = require("../controllers/admin/activityController");
const dashboardCtrl = require("../controllers/admin/dashboardController");
const studentCtrl = require("../controllers/studentController");

// All routes below require admin auth
router.use(guard, authorize("admin"));

/* ── DASHBOARD ─────────────────────────────────────────── */
router.get("/dashboard", dashboardCtrl.getDashboardStats);

/* ── USERS ──────────────────────────────────────────────── */
router.get("/users", userCtrl.getAllUsers);
router.delete("/user/:id", userCtrl.deleteUser);
router.put("/user/:id/role", userCtrl.updateUserRole);

/* ── MENTORS ────────────────────────────────────────────── */
router.get("/mentors", userCtrl.getAllMentors);
router.get("/pending-mentors", userCtrl.getPendingMentors);
router.post("/mentor", userCtrl.createMentor);
router.put("/mentor/:id/approve", userCtrl.approveMentor);
router.put("/mentor/:id/reject", userCtrl.rejectMentor);
router.get("/search-mentors", userCtrl.searchMentors);

/* ── COURSES ────────────────────────────────────────────── */
router.get("/courses", courseCtrl.adminGetCourses);
router.post("/courses", courseCtrl.createCourse);
router.delete("/course/:id", courseCtrl.adminDeleteCourse);
router.put("/course/:id", courseCtrl.adminUpdateCourse);

/* ── LESSONS ────────────────────────────────────────────── */
router.get("/lessons", lessonCtrl.adminGetLessons);
router.delete("/lesson/:id", lessonCtrl.adminDeleteLesson);

/* ── QUIZZES ────────────────────────────────────────────── */
router.get("/quizzes", quizCtrl.adminGetQuizzes);
router.delete("/quiz/:id", quizCtrl.adminDeleteQuiz);

/* ── LEADERBOARD ────────────────────────────────────────── */
router.get("/leaderboard", leaderboardCtrl.getLeaderboard);

/* ── ANNOUNCEMENTS ──────────────────────────────────────── */
router.post("/announcement", announcementCtrl.createAnnouncement);
router.delete("/announcement/:id", announcementCtrl.deleteAnnouncement);
router.get("/announcements", announcementCtrl.getAnnouncements);

/* ── ACTIVITIES ─────────────────────────────────────────── */
router.get("/activities", activityCtrl.getRecentActivities);
router.get("/activities/all", activityCtrl.getAllActivities);

/* ── STUDENTS ───────────────────────────────────────────── */
router.get("/students", studentCtrl.getStudents);
router.post("/students", studentCtrl.createStudent);
router.get("/students/:id", studentCtrl.getStudentById);
router.put("/students/:id", studentCtrl.updateStudent);
router.delete("/students/:id", studentCtrl.deleteStudent);
router.patch("/students/:id/status", studentCtrl.updateStatus);

/* ── ANALYTICS ──────────────────────────────────────────── */
router.get("/analytics", progressCtrl.getPlatformAnalytics);

/* ── STUDENT PROGRESS (admin view) ─────────────────────── */
router.get("/students-progress", async (req, res) => {
  try {
    const Progress = require("../models/Progress");
    const Lesson = require("../models/Lesson");

    const allProgress = await Progress.find()
      .populate("user", "name email learningProfile")
      .populate("course", "title")
      .sort({ updatedAt: -1 });

    const results = await Promise.all(allProgress.map(async (p) => {
      const totalLessons = await Lesson.countDocuments({ course: p.course?._id });
      let completedLessons = 0;
      p.levelsProgress.forEach(lp => { completedLessons += lp.completedLessons.length; });
      const pct = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
      const completedLevels = p.levelsProgress.filter(lp => lp.isCompleted).length;

      return {
        _id: p._id,
        student: p.user,
        course: p.course,
        totalLessons,
        completedLessons,
        progressPercent: pct,
        xpEarned: p.xpEarned,
        completedLevels,
        lastUpdated: p.updatedAt
      };
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GRADES (quiz scores per student) ───────────────────── */
router.get("/grades", async (req, res) => {
  try {
    const Progress = require("../models/Progress");
    const Level = require("../models/Level");

    const allProgress = await Progress.find()
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ updatedAt: -1 });

    const rows = [];
    for (const p of allProgress) {
      for (const lp of p.levelsProgress) {
        if (lp.score > 0) {
          const level = await Level.findById(lp.level).select("title order");
          rows.push({
            student: p.user,
            course: p.course,
            level: level ? `${level.title} (Level ${level.order})` : "Unknown",
            score: lp.score,
            isCompleted: lp.isCompleted,
            completedLessons: lp.completedLessons.length,
            lastUpdated: p.updatedAt
          });
        }
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MENTOR SESSION REVIEWS ─────────────────────────────── */
router.get("/session-reviews", async (req, res) => {
  try {
    const Session = require("../models/Session");
    const sessions = await Session.find({
      status: "completed",
      studentRating: { $gt: 0 }
    })
      .populate("studentId", "name email")
      .populate("mentorId", "name email learningProfile")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a session review (removes rating and comment)
router.delete("/session-reviews/:id", async (req, res) => {
  try {
    const Session = require("../models/Session");
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Clear the rating and comment - bypass validators to avoid min:1 issues
    await Session.findByIdAndUpdate(req.params.id, {
      $set: { studentRating: null, studentComment: "" }
    }, { runValidators: false });

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CATEGORIES (derived from courses) ──────────────────── */
router.get("/categories", async (req, res) => {
  try {
    const Course = require("../models/Course");
    const courses = await Course.find().select("title category").sort({ createdAt: -1 });

    const categoryMap = {};
    for (const course of courses) {
      const cat = course.category || "Uncategorized";
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, courseCount: 0, courses: [] };
      }
      categoryMap[cat].courseCount++;
      categoryMap[cat].courses.push({ _id: course._id, title: course.title });
    }

    const categories = Object.values(categoryMap).sort((a, b) => b.courseCount - a.courseCount);
    res.json({ success: true, data: categories, total: categories.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/categories/rename", async (req, res) => {
  try {
    const Course = require("../models/Course");
    const { oldName, newName } = req.body;
    if (!oldName || !newName) {
      return res.status(400).json({ message: "oldName and newName are required" });
    }
    const result = await Course.updateMany(
      { category: oldName },
      { $set: { category: newName.trim() } }
    );
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── RATINGS OVERVIEW ───────────────────────────────────── */
router.get("/ratings-overview", async (req, res) => {
  try {
    const Session = require("../models/Session");
    const Course = require("../models/Course");

    // All rated sessions
    const ratedSessions = await Session.find({ studentRating: { $gt: 0 } })
      .populate("mentorId", "name learningProfile");

    const total = ratedSessions.length;
    if (total === 0) {
      return res.json({
        success: true,
        avgRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        totalRatings: 0,
        categoryRatings: []
      });
    }

    const sum = ratedSessions.reduce((s, r) => s + r.studentRating, 0);
    const avgRating = Math.round((sum / total) * 10) / 10;

    // Distribution
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratedSessions.forEach(r => { dist[r.studentRating] = (dist[r.studentRating] || 0) + 1; });

    // Per-track ratings
    const trackMap = {};
    ratedSessions.forEach(r => {
      const track = r.mentorId?.learningProfile?.skillTrack || "General";
      if (!trackMap[track]) trackMap[track] = { sum: 0, count: 0 };
      trackMap[track].sum += r.studentRating;
      trackMap[track].count++;
    });
    const categoryRatings = Object.entries(trackMap)
      .map(([name, v]) => ({ name, rating: Math.round((v.sum / v.count) * 10) / 10, count: v.count }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6);

    res.json({ success: true, avgRating, distribution: dist, totalRatings: total, categoryRatings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PLATFORM STATS (for system settings) ───────────────── */
router.get("/platform-stats", async (req, res) => {
  try {
    const Course = require("../models/Course");
    const Lesson = require("../models/Lesson");
    const Progress = require("../models/Progress");
    const Session = require("../models/Session");
    const Activity = require("../models/Activity");

    const [
      totalUsers, totalStudents, totalMentors,
      totalCourses, totalLessons,
      totalSessions, totalActivities,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "mentor", "mentorVerification.status": "approved" }),
      Course.countDocuments(),
      Lesson.countDocuments(),
      Session.countDocuments(),
      Activity.countDocuments(),
      Activity.findOne().sort({ createdAt: -1 }).select("createdAt")
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalStudents, totalMentors,
        totalCourses, totalLessons,
        totalSessions, totalActivities,
        lastActivity: recentActivity?.createdAt || null,
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime())
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MENTOR CAPACITY OVERVIEW ───────────────────────────── */
router.get("/mentor-capacity", async (req, res) => {
  try {
    const { MAX_STUDENTS_PER_MENTOR } = require("../utils/assignMentor");

    const mentors = await User.find({
      role: "mentor",
      "mentorVerification.status": "approved"
    }).select("name email learningProfile studentCount");

    const data = await Promise.all(mentors.map(async (m) => {
      const actualCount = await User.countDocuments({ assignedMentor: m._id });
      // Sync cached count if drifted
      if (actualCount !== m.studentCount) {
        await User.findByIdAndUpdate(m._id, { studentCount: actualCount });
      }
      return {
        _id: m._id,
        name: m.name,
        email: m.email,
        skillTrack: m.learningProfile?.skillTrack || "—",
        studentCount: actualCount,
        capacity: MAX_STUDENTS_PER_MENTOR,
        available: actualCount < MAX_STUDENTS_PER_MENTOR,
        fillPercent: Math.round((actualCount / MAX_STUDENTS_PER_MENTOR) * 100)
      };
    }));

    // Students without a mentor
    const unassigned = await User.countDocuments({
      role: "student",
      onboardingCompleted: true,
      $or: [{ assignedMentor: null }, { assignedMentor: { $exists: false } }]
    });

    res.json({ success: true, mentors: data, unassignedStudents: unassigned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── UNASSIGNED STUDENTS ────────────────────────────────── */
router.get("/unassigned-students", async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      onboardingCompleted: true,
      $or: [{ assignedMentor: null }, { assignedMentor: { $exists: false } }]
    }).select("name email learningProfile createdAt").sort({ createdAt: -1 });

    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MANUALLY ASSIGN MENTOR TO STUDENT ──────────────────── */
router.put("/assign-mentor", async (req, res) => {
  try {
    const { studentId, mentorId } = req.body;
    if (!studentId || !mentorId) return res.status(400).json({ message: "studentId and mentorId required" });

    const { MAX_STUDENTS_PER_MENTOR, unassignMentor } = require("../utils/assignMentor");

    const student = await User.findById(studentId);
    const mentor = await User.findById(mentorId);

    if (!student || student.role !== "student") return res.status(404).json({ message: "Student not found" });
    if (!mentor || mentor.role !== "mentor") return res.status(404).json({ message: "Mentor not found" });

    const mentorStudentCount = await User.countDocuments({ assignedMentor: mentorId });
    if (mentorStudentCount >= MAX_STUDENTS_PER_MENTOR) {
      return res.status(400).json({ message: `Mentor is at full capacity (${MAX_STUDENTS_PER_MENTOR} students)` });
    }

    // Remove from old mentor if any
    if (student.assignedMentor && student.assignedMentor.toString() !== mentorId) {
      await unassignMentor(studentId, student.assignedMentor.toString());
    }

    // Assign new mentor
    await User.findByIdAndUpdate(studentId, { assignedMentor: mentorId });
    await User.findByIdAndUpdate(mentorId, { studentCount: mentorStudentCount + 1 });

    res.json({ success: true, message: `${student.name} assigned to ${mentor.name}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── AUTO-ASSIGN ALL UNASSIGNED STUDENTS ────────────────── */
router.post("/auto-assign-mentors", async (req, res) => {
  try {
    const { assignMentor } = require("../utils/assignMentor");

    const unassigned = await User.find({
      role: "student",
      onboardingCompleted: true,
      $or: [{ assignedMentor: null }, { assignedMentor: { $exists: false } }]
    });

    let assigned = 0, failed = 0;
    for (const student of unassigned) {
      const mentor = await assignMentor(student);
      if (mentor) assigned++;
      else failed++;
    }

    res.json({ success: true, assigned, failed, total: unassigned.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── STUDENT REPORTS (aggregated analytics) ─────────────── */
router.get("/reports", async (req, res) => {
  try {
    const Progress = require("../models/Progress");
    const Course = require("../models/Course");
    const Lesson = require("../models/Lesson");
    const Achievement = require("../models/Achievement");

    // Core counts
    const totalStudents = await User.countDocuments({ role: "student" });
    const activeStudents = await User.countDocuments({ role: "student", onboardingCompleted: true });
    const totalCourses = await Course.countDocuments();
    const totalLessons = await Lesson.countDocuments();
    const totalAchievements = await Achievement.countDocuments();

    // Progress aggregation
    const allProgress = await Progress.find();
    const totalXP = allProgress.reduce((s, p) => s + p.xpEarned, 0);

    let totalCompleted = 0;
    allProgress.forEach(p => {
      p.levelsProgress.forEach(lp => { totalCompleted += lp.completedLessons.length; });
    });

    const completionRate = totalLessons > 0 && allProgress.length > 0
      ? Math.min(100, Math.round((totalCompleted / (allProgress.length * (totalLessons / Math.max(totalCourses, 1)))) * 100))
      : 0;

    let scoreSum = 0, scoreCount = 0;
    allProgress.forEach(p => {
      p.levelsProgress.forEach(lp => {
        if (lp.score > 0) { scoreSum += lp.score; scoreCount++; }
      });
    });
    const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    // Top 5 most enrolled courses
    const enrollmentsByCourse = await Progress.aggregate([
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topCourses = await Promise.all(enrollmentsByCourse.map(async e => {
      const course = await Course.findById(e._id).select("title category");
      return {
        title: course?.title || "Unknown",
        category: course?.category || "—",
        enrollments: e.count
      };
    }));

    // Students by skill track
    const trackAgg = await User.aggregate([
      { $match: { role: "student", "learningProfile.skillTrack": { $exists: true, $ne: "" } } },
      { $group: { _id: "$learningProfile.skillTrack", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // New students last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const newStudentsRaw = await User.aggregate([
      { $match: { role: "student", createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const dateMap = Object.fromEntries(newStudentsRaw.map(r => [r._id, r.count]));

    const newStudentsChart = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      newStudentsChart.push({
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: dateMap[iso] || 0
      });
    }

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalCourses,
        totalLessons,
        totalXP,
        completionRate,
        avgScore,
        totalAchievements
      },
      topCourses,
      trackDistribution: trackAgg.map(t => ({ track: t._id, count: t.count })),
      newStudentsChart
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
