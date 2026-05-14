const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { lessonUpload } = require("../middleware/uploadMiddleware");
const { guard, authorize } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Session = require("../models/Session");
const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Level = require("../models/Level");
const Quiz = require("../models/Quiz");
const { logActivity } = require("../utils/activityLogger");

/* ── UPLOAD DOCUMENTS ───────────────────────────────────── */
router.post("/upload-documents", guard, upload.array("documents", 5), async (req, res) => {
  try {
    if (req.user.role !== "mentor") return res.status(403).json({ message: "Access denied" });
    const files = req.files.map(f => f.path);
    req.user.mentorVerification.documents.push(...files);
    req.user.mentorVerification.status = "pending";
    await req.user.save();
    res.status(200).json({ message: "Documents uploaded. Awaiting admin approval." });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ── DASHBOARD ──────────────────────────────────────────── */
router.get("/dashboard", guard, authorize("mentor"), async (req, res) => {
  try {
    const mentorId = req.user._id;

    const upcomingSessions = await Session.find({
      mentorId, status: "scheduled", date: { $gte: new Date() }
    }).populate("studentId", "name email").sort({ date: 1 }).limit(5);

    const completedSessions = await Session.countDocuments({ mentorId, status: "completed" });
    const totalSessions = await Session.countDocuments({ mentorId });

    const courses = await Course.find({ instructor: mentorId });
    const courseIds = courses.map(c => c._id);

    // Get assigned students directly from User model
    const assignedStudents = await User.find({ assignedMentor: mentorId, role: "student" }).select("name email learningProfile.experienceLevel learningProfile.skillTrack");
    const assignedStudentsCount = assignedStudents.length;

    const enrollments = await Progress.find({ course: { $in: courseIds } })
      .populate("user", "name email learningProfile.experienceLevel learningProfile.skillTrack")
      .sort({ updatedAt: -1 });

    const studentMap = new Map();
    
    // 1. Add assigned students to map first
    assignedStudents.forEach(student => {
      studentMap.set(student._id.toString(), {
        ...student.toObject(),
        xp: 0,
        course: student.learningProfile?.skillTrack || ""
      });
    });

    // 2. Add or update with enrollment progress 
    enrollments.forEach(e => {
      if (e.user) {
        studentMap.set(e.user._id.toString(), {
          ...e.user.toObject(),
          xp: e.xpEarned,
          course: courses.find(c => c._id.toString() === e.course.toString())?.title || e.user.learningProfile?.skillTrack || ""
        });
      }
    });
    const students = Array.from(studentMap.values());
    const topStudent = [...students].sort((a, b) => b.xp - a.xp)[0] || null;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate sessions by day of week (MongoDB: 1=Sunday .. 7=Saturday)
    const weeklyRaw = await Session.aggregate([
      { $match: { mentorId, createdAt: { $gte: sevenDaysAgo } } },
      { $project: { day: { $dayOfWeek: "$createdAt" } } },
      { $group: { _id: "$day", val: { $sum: 1 } } }
    ]);
    const weeklyMapByNum = Object.fromEntries(weeklyRaw.map(r => [r._id, r.val]));
    const dayNames = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"};
    // Order as Mon..Sun
    const order = [2,3,4,5,6,7,1];
    const weeklyData = order.map(n => ({ name: dayNames[n], val: weeklyMapByNum[n] || 0 }));

    res.json({
      stats: {
        totalStudents: Math.max(students.length, assignedStudentsCount),
        totalCourses: courses.length,
        completedSessions,
        totalSessions,
        topMentee: topStudent ? { name: topStudent.name, score: topStudent.xp } : null
      },
      upcomingSessions,
      students: students.slice(0, 10),
      courses,
      weeklyData
    });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ── MY COURSES (with stats) ────────────────────────────── */
router.get("/my-courses", guard, authorize("mentor"), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({ createdAt: -1 });

    const coursesWithStats = await Promise.all(courses.map(async (course) => {
      const totalLessons = await Lesson.countDocuments({ course: course._id });
      const totalLevels = await Level.countDocuments({ course: course._id });
      const enrollments = await Progress.countDocuments({ course: course._id });
      const completedCount = await Progress.countDocuments({ course: course._id, "levelsProgress.isCompleted": true });

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        createdAt: course.createdAt,
        totalLessons,
        totalLevels,
        enrollments,
        completedCount
      };
    }));

    res.json({ success: true, data: coursesWithStats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── COURSE DETAIL (roadmap + students + progress) ──────── */
router.get("/course/:courseId", guard, authorize("mentor"), async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Levels with lesson counts
    const levels = await Level.find({ course: courseId }).sort({ order: 1 });
    const levelsWithLessons = await Promise.all(levels.map(async (lv) => {
      const lessons = await Lesson.find({ level: lv._id }).sort({ order: 1 });
      return { ...lv.toObject(), lessons };
    }));

    // Enrolled students with progress
    const enrollments = await Progress.find({ course: courseId })
      .populate("user", "name email learningProfile.experienceLevel")
      .sort({ updatedAt: -1 });

    const totalLessons = await Lesson.countDocuments({ course: courseId });

    const students = enrollments.map(e => {
      let completed = 0;
      e.levelsProgress.forEach(lp => { completed += lp.completedLessons.length; });
      const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
      return {
        _id: e.user?._id,
        name: e.user?.name,
        email: e.user?.email,
        xp: e.xpEarned,
        progressPercent: pct,
        completedLessons: completed,
        lastActive: e.updatedAt
      };
    });

    res.json({ success: true, course, levels: levelsWithLessons, students, totalLessons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── COURSE ANALYSIS (stats per course) ─────────────────── */
router.get("/course/:courseId/analysis", guard, authorize("mentor"), async (req, res) => {
  try {
    const { courseId } = req.params;

    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const totalLevels = await Level.countDocuments({ course: courseId });
    const enrollments = await Progress.find({ course: courseId });
    const totalStudents = enrollments.length;

    let totalCompleted = 0, totalXP = 0, scoreSum = 0, scoreCount = 0;
    let completedCourses = 0;

    enrollments.forEach(e => {
      totalXP += e.xpEarned;
      e.levelsProgress.forEach(lp => {
        totalCompleted += lp.completedLessons.length;
        if (lp.score > 0) { scoreSum += lp.score; scoreCount++; }
      });
      const allDone = e.levelsProgress.every(lp => lp.isCompleted);
      if (allDone && e.levelsProgress.length > 0) completedCourses++;
    });

    const avgProgress = totalStudents > 0 && totalLessons > 0
      ? Math.round((totalCompleted / (totalStudents * totalLessons)) * 100)
      : 0;
    const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
    const completionRate = totalStudents > 0 ? Math.round((completedCourses / totalStudents) * 100) : 0;

    // Weekly enrollments (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate progress by day of week (1=Sunday..7=Saturday)
    const weeklyRaw = await Progress.aggregate([
      { $match: { course: require("mongoose").Types.ObjectId.createFromHexString(courseId), createdAt: { $gte: sevenDaysAgo } } },
      { $project: { day: { $dayOfWeek: "$createdAt" } } },
      { $group: { _id: "$day", count: { $sum: 1 } } }
    ]);
    const weeklyMapByNum = Object.fromEntries(weeklyRaw.map(r => [r._id, r.count]));
    const dayNames = {1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat"};
    const order = [2,3,4,5,6,7,1];
    const weeklyData = order.map(n => ({ day: dayNames[n], count: weeklyMapByNum[n] || 0 }));

    res.json({
      success: true,
      stats: { totalStudents, totalLessons, totalLevels, avgProgress, avgScore, completionRate, totalXP },
      weeklyData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── REVIEW QUEUE (quiz scores for mentor's courses) ─────── */
router.get("/review-queue", guard, authorize("mentor"), async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id });
    const courseIds = courses.map(c => c._id);

    const allProgress = await Progress.find({ course: { $in: courseIds } })
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
            submittedAt: p.updatedAt
          });
        }
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── LESSONS FOR A COURSE ───────────────────────────────── */
router.get("/course/:courseId/lessons", guard, authorize("mentor"), async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId })
      .populate("level", "title order")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: lessons });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CREATE LESSON ──────────────────────────────────────── */
router.post("/lesson", guard, authorize("mentor"), async (req, res) => {
  try {
    const { title, description, content, videoUrl, order, levelId, courseId } = req.body;
    if (!title || !levelId || !courseId) return res.status(400).json({ message: "Title, levelId, and courseId are required" });

    const level = await Level.findById(levelId);
    if (!level) return res.status(404).json({ message: "Level not found" });

    const lesson = await Lesson.create({ title, description, content, videoUrl, order: order || 1, level: levelId, course: courseId, createdBy: req.user._id });

    logActivity({ user: req.user._id, type: "LESSON_CREATED", message: `Mentor created lesson "${lesson.title}"` }).catch(() => { });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── UPDATE LESSON ──────────────────────────────────────── */
router.put("/lesson/:id", guard, authorize("mentor"), async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE LESSON ──────────────────────────────────────── */
router.delete("/lesson/:id", guard, authorize("mentor"), async (req, res) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lesson deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── CREATE QUIZ ────────────────────────────────────────── */
router.post("/quiz", guard, authorize("mentor"), async (req, res) => {
  try {
    const { lessonId, questions } = req.body;
    if (!lessonId || !questions?.length) return res.status(400).json({ message: "lessonId and questions are required" });
    
    // Update existing or create new quiz
    const quiz = await Quiz.findOneAndUpdate(
      { lesson: lessonId },
      { lesson: lessonId, questions },
      { upsert: true, new: true }
    );
    
    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── GET QUIZ FOR LESSON ────────────────────────────────── */
router.get("/quiz/:lessonId", guard, authorize("mentor"), async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ lesson: req.params.lessonId });
    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MY SESSIONS ────────────────────────────────────────── */
router.get("/sessions", guard, authorize("mentor"), async (req, res) => {
  try {
    const sessions = await Session.find({ mentorId: req.user._id })
      .populate("studentId", "name email")
      .sort({ date: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── UPLOAD FILES TO LESSON ─────────────────────────────── */
router.post("/lesson/:id/upload", guard, authorize("mentor"), lessonUpload.array("files", 10), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const getType = (mime) => {
      if (mime.startsWith("image/")) return "image";
      if (mime.startsWith("video/")) return "video";
      if (mime.startsWith("audio/")) return "audio";
      if (mime === "application/pdf") return "pdf";
      if (mime.includes("word") || mime.includes("document")) return "doc";
      if (mime.includes("presentation") || mime.includes("powerpoint")) return "ppt";
      if (mime.includes("spreadsheet") || mime.includes("excel")) return "xls";
      return "other";
    };

    const newAttachments = req.files.map(file => ({
      name: file.originalname,
      url: `/uploads/lesson-files/${file.filename}`,
      type: getType(file.mimetype),
      mimeType: file.mimetype,
      size: file.size,
    }));

    lesson.attachments = [...(lesson.attachments || []), ...newAttachments];
    await lesson.save();

    logActivity({
      user: req.user._id,
      type: "LESSON_CREATED",
      message: `Mentor uploaded ${req.files.length} file(s) to lesson "${lesson.title}"`
    }).catch(() => { });

    res.json({ success: true, attachments: lesson.attachments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── DELETE ATTACHMENT FROM LESSON ─────────────────────── */
router.delete("/lesson/:id/attachment", guard, authorize("mentor"), async (req, res) => {
  try {
    const { url } = req.body;
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    lesson.attachments = (lesson.attachments || []).filter(a => a.url !== url);
    await lesson.save();

    // Delete physical file
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "..", url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MY ASSIGNED STUDENTS ───────────────────────────────── */
router.get("/my-students", guard, authorize("mentor"), async (req, res) => {
  try {
    const students = await User.find({ assignedMentor: req.user._id, role: "student" })
      .select("name email learningProfile.skillTrack learningProfile.experienceLevel")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── PROJECTS ───────────────────────────────────────────── */
const Project = require("../models/Project");

// Create project
router.post("/projects", guard, authorize("mentor"), async (req, res) => {
  try {
    const { title, description, instructions, dueDate, assignedTo, courseId } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
    if (!assignedTo?.length) return res.status(400).json({ message: "Assign to at least one student" });

    const project = await Project.create({
      title, description, instructions,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      mentor: req.user._id,
      assignedTo,
      course: courseId || undefined
    });

    logActivity({ user: req.user._id, type: "LESSON_CREATED", message: `Mentor assigned project "${title}"` }).catch(() => { });

    // Notify each assigned student
    const { createNotification } = require("./notificationController");
    for (const studentId of assignedTo) {
      await createNotification({
        userId: studentId,
        type: "info",
        title: "New Project Assigned",
        message: `Your mentor assigned you a new project: "${title}"`,
        link: "/projects",
        icon: "folder"
      }).catch(err => console.error("Failed to notify student:", err));
    }

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all projects by this mentor
router.get("/projects", guard, authorize("mentor"), async (req, res) => {
  try {
    const projects = await Project.find({ mentor: req.user._id })
      .populate("assignedTo", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single project
router.get("/projects/:id", guard, authorize("mentor"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("assignedTo", "name email learningProfile.skillTrack")
      .populate("submissions.student", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update project
router.put("/projects/:id", guard, authorize("mentor"), async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user._id },
      req.body,
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete project
router.delete("/projects/:id", guard, authorize("mentor"), async (req, res) => {
  try {
    await Project.findOneAndDelete({ _id: req.params.id, mentor: req.user._id });
    res.json({ success: true, message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Grade a submission
router.put("/projects/:id/grade/:studentId", guard, authorize("mentor"), async (req, res) => {
  try {
    const { grade, feedback, status } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const sub = project.submissions.find(s => s.student.toString() === req.params.studentId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    // New grading logic: combine AI scores with mentor score
    if (grade !== undefined) {
      // Support for numeric manual grading (0 - 50)
      const numericGrade = parseFloat(grade);
      if (!isNaN(numericGrade)) {
        sub.mentorScore = Math.max(0, Math.min(50, numericGrade));
      }
      sub.grade = grade; // keep for UI compatibility
    }

    if (feedback) sub.feedback = feedback;
    if (status) sub.status = status;

    // Calculate final score: AI (50%) + Mentor (50%)
    // AI Understanding (20) + AI Authenticity (30) + Mentor (50) = 100
    sub.finalScore = (sub.aiUnderstandingScore || 0) + (sub.aiAuthenticityScore || 0) + (sub.mentorScore || 0);
    
    await project.save();

    // Notify student about grading
    const { createNotification } = require("./notificationController");
    await createNotification({
      userId: req.params.studentId,
      type: "success",
      title: "Project Graded",
      message: `Your project "${project.title}" has been graded${grade ? `: ${grade}` : ""}`,
      link: "/projects",
      icon: "star"
    }).catch(err => console.error("Failed to notify student:", err));

    // Update student's progress/performance based on grade when reviewed
    try {
      if (status === "reviewed") {
        const Progress = require("../models/Progress");
        const { logActivity } = require("../utils/activityLogger");

        // Determine points from grade (support percent or letter grades)
        let points = 0;
        if (grade && typeof grade === "string") {
          const g = grade.trim();
          if (g.endsWith("%")) {
            const n = parseFloat(g.replace("%", ""));
            if (!isNaN(n)) points = Math.max(0, Math.min(100, n));
          } else {
            const MAP = {"A+":100,"A":95,"A-":90,"B+":85,"B":80,"B-":75,"C+":70,"C":65,"C-":60,"D":50,"F":0};
            points = MAP[g.toUpperCase()] ?? 0;
          }
        }

        // If project links to a course, add xp to that course progress for student
        if (project.course && points > 0) {
          const prog = await Progress.findOne({ user: req.params.studentId, course: project.course });
          if (prog) {
            prog.xpEarned = (prog.xpEarned || 0) + Math.round(points);
            await prog.save();
            await logActivity({ user: req.params.studentId, type: "progress", message: `Earned ${Math.round(points)} XP from project ${project.title}`, meta: { project: project._id, course: project.course } }).catch(()=>{});
          }
        }
      }
    } catch (err) {
      console.error("Failed to update student progress after grading:", err.message);
    }

    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ── MENTOR PROFILE UPDATE ──────────────────────────────── */
router.put("/profile", guard, authorize("mentor"), async (req, res) => {
  try {
    const { name, skillTrack, experienceLevel, commitmentTime, learningStyle, learningGoal, bio } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (skillTrack) updates["learningProfile.skillTrack"] = skillTrack;
    if (experienceLevel) updates["learningProfile.experienceLevel"] = experienceLevel;
    if (commitmentTime) updates["learningProfile.commitmentTime"] = commitmentTime;
    if (learningStyle) updates["learningProfile.learningStyle"] = learningStyle;
    if (learningGoal) updates["learningProfile.learningGoal"] = learningGoal;
    if (bio) updates["learningProfile.personalGoal"] = bio;

    const updated = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select("-password");
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
