const Match = require("../models/Match");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// GET /api/match/buddies
const findStudyBuddies = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const skillTrack = currentUser.learningProfile?.skillTrack;
  const experienceLevel = currentUser.learningProfile?.experienceLevel;

  if (!skillTrack) {
    return res.status(400).json({ message: "Complete your profile to find study buddies" });
  }

  const query = {
    _id: { $ne: currentUser._id },
    role: "student",
    onboardingCompleted: true,
    "learningProfile.skillTrack": skillTrack
  };
  if (experienceLevel) query["learningProfile.experienceLevel"] = experienceLevel;

  const buddies = await User.find(query)
    .select("name email learningProfile.skillTrack learningProfile.experienceLevel learningProfile.learningGoal createdAt")
    .limit(10)
    .sort({ createdAt: -1 });

  res.json({ success: true, count: buddies.length, data: buddies });
});

// POST /api/match/request
const sendMatchRequest = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ message: "Target user ID is required" });
  if (targetUserId === req.user._id.toString()) return res.status(400).json({ message: "Cannot match with yourself" });

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.role !== "student") return res.status(404).json({ message: "Student not found" });

  const existing = await Match.findOne({
    $or: [
      { student1: req.user._id, student2: targetUserId },
      { student1: targetUserId, student2: req.user._id }
    ]
  });
  if (existing) return res.status(400).json({ message: "Match already exists" });

  const match = await Match.create({
    student1: req.user._id,
    student2: targetUserId,
    course: req.user.learningProfile?.skillTrack || "",
    level: req.user.learningProfile?.experienceLevel || ""
  });

  res.status(201).json({ success: true, message: "Study buddy request sent", data: match });
});

// GET /api/match/my-matches
const getMyMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({
    $or: [{ student1: req.user._id }, { student2: req.user._id }]
  })
    .populate("student1", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .populate("student2", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .sort({ createdAt: -1 });

  const buddies = matches.map(m => {
    const other = m.student1._id.toString() === req.user._id.toString() ? m.student2 : m.student1;
    return { matchId: m._id, buddy: other, course: m.course, level: m.level, matchedAt: m.createdAt };
  });

  res.json({ success: true, data: buddies });
});

module.exports = { findStudyBuddies, sendMatchRequest, getMyMatches };
