const express = require("express");
const router  = express.Router();
const { guard } = require("../middleware/authMiddleware");
const upload  = require("../middleware/uploadMiddleware");
const { avatarUpload } = require("../middleware/uploadMiddleware");
const { getMyProfile, updateMyProfile, changePassword, completeProfile } = require("../controllers/userController");
const User = require("../models/User");

router.get("/profile",         guard, getMyProfile);
router.put("/profile",         guard, updateMyProfile);
router.put("/change-password", guard, changePassword);
router.post("/onboarding",     guard, upload.array("documents", 5), completeProfile);

// POST /api/users/upload-avatar — upload profile picture
router.post("/upload-avatar", guard, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { avatarUrl });
    res.json({ success: true, avatarUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET assigned mentor for the logged-in student
router.get("/my-mentor", guard, async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate(
      "assignedMentor",
      "name email learningProfile.skillTrack learningProfile.experienceLevel studentCount"
    );

    if (!student.assignedMentor) {
      return res.json({ success: true, mentor: null });
    }

    // Get mentor's avg rating
    const Session = require("../models/Session");
    const ratingAgg = await Session.aggregate([
      { $match: { mentorId: student.assignedMentor._id, studentRating: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$studentRating" }, count: { $sum: 1 } } }
    ]);
    const avgRating = ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : null;
    const reviewCount = ratingAgg[0]?.count || 0;

    res.json({
      success: true,
      mentor: {
        _id: student.assignedMentor._id,
        name: student.assignedMentor.name,
        email: student.assignedMentor.email,
        skillTrack: student.assignedMentor.learningProfile?.skillTrack || "—",
        studentCount: student.assignedMentor.studentCount || 0,
        avgRating,
        reviewCount
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET projects assigned to this student
router.get("/my-projects", guard, async (req, res) => {
  try {
    const Project = require("../models/Project");
    const projects = await Project.find({
      assignedTo: req.user._id,
      status: "active"
    })
      .populate("mentor", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit a project
router.post("/my-projects/:id/submit", guard, async (req, res) => {
  try {
    const Project = require("../models/Project");
    const { description, link } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const alreadySubmitted = project.submissions.find(
      s => s.student.toString() === req.user._id.toString()
    );
    if (alreadySubmitted) {
      alreadySubmitted.description = description || alreadySubmitted.description;
      alreadySubmitted.link        = link || alreadySubmitted.link;
      alreadySubmitted.submittedAt = new Date();
    } else {
      project.submissions.push({ student: req.user._id, description, link });
    }

    await project.save();

    // Notify mentor about submission
    const { createNotification } = require("../controllers/notificationController");
    await createNotification({
      userId: project.mentor,
      type: "info",
      title: "Project Submitted",
      message: `${req.user.name} submitted the project "${project.title}"`,
      link: "/mentor/projects",
      icon: "file-text"
    }).catch(err => console.error("Failed to notify mentor:", err));

    res.json({ success: true, message: "Project submitted!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
