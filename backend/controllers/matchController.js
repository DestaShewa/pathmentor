const Match = require("../models/Match");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");

// ── GET /api/match/buddies ───────────────────────────────────
// Returns students on the same skill track (excluding already-matched)
const findStudyBuddies = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const skillTrack = currentUser.learningProfile?.skillTrack;

  if (!skillTrack) {
    return res.status(400).json({ message: "Complete your profile to find study buddies" });
  }

  // Find all existing matches (any status) involving this user
  const existingMatches = await Match.find({
    $or: [{ student1: currentUser._id }, { student2: currentUser._id }]
  });
  const matchedIds = new Set(
    existingMatches.flatMap(m => [m.student1.toString(), m.student2.toString()])
  );
  matchedIds.delete(currentUser._id.toString());

  const buddies = await User.find({
    _id: { $ne: currentUser._id, $nin: [...matchedIds] },
    role: "student",
    onboardingCompleted: true,
    "learningProfile.skillTrack": skillTrack,
  })
    .select("name email learningProfile.skillTrack learningProfile.experienceLevel learningProfile.learningGoal createdAt")
    .limit(20)
    .sort({ createdAt: -1 });

  res.json({ success: true, count: buddies.length, data: buddies });
});

// ── POST /api/match/request ──────────────────────────────────
// Send a buddy request — creates a match with status "pending"
const sendMatchRequest = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ message: "Target user ID is required" });
  if (targetUserId === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot send request to yourself" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser || targetUser.role !== "student") {
    return res.status(404).json({ message: "Student not found" });
  }

  // Check for existing match in any direction
  const existing = await Match.findOne({
    $or: [
      { student1: req.user._id, student2: targetUserId },
      { student1: targetUserId, student2: req.user._id },
    ],
  });
  if (existing) {
    return res.status(400).json({
      message: existing.status === "pending"
        ? "Request already sent — waiting for acceptance"
        : existing.status === "accepted"
        ? "Already connected"
        : "Request was previously rejected",
    });
  }

  const match = await Match.create({
    student1: req.user._id,
    student2: targetUserId,
    course: req.user.learningProfile?.skillTrack || "",
    level: req.user.learningProfile?.experienceLevel || "",
    status: "pending",
    requestedBy: req.user._id,
  });

  // Real-time notification to target user
  const io = global.io;
  if (io) {
    io.to(`user:${targetUserId}`).emit("buddyRequest", {
      from: { _id: req.user._id, name: req.user.name },
      matchId: match._id,
    });
  }

  res.status(201).json({ success: true, message: "Study buddy request sent", data: match });
});

// ── PUT /api/match/:id/accept ────────────────────────────────
const acceptMatchRequest = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ message: "Match not found" });

  // Only the recipient (student2) can accept
  if (match.student2.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the recipient can accept this request" });
  }
  if (match.status !== "pending") {
    return res.status(400).json({ message: `Request is already ${match.status}` });
  }

  match.status = "accepted";
  await match.save();

  // Notify the requester
  const io = global.io;
  if (io) {
    io.to(`user:${match.student1.toString()}`).emit("buddyAccepted", {
      matchId: match._id,
      by: { _id: req.user._id, name: req.user.name },
    });
  }

  res.json({ success: true, message: "Request accepted", data: match });
});

// ── PUT /api/match/:id/reject ────────────────────────────────
const rejectMatchRequest = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ message: "Match not found" });

  if (match.student2.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the recipient can reject this request" });
  }
  if (match.status !== "pending") {
    return res.status(400).json({ message: `Request is already ${match.status}` });
  }

  match.status = "rejected";
  await match.save();

  res.json({ success: true, message: "Request rejected" });
});

// ── DELETE /api/match/:id ────────────────────────────────────
const removeMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) return res.status(404).json({ message: "Match not found" });

  const isParticipant =
    match.student1.toString() === req.user._id.toString() ||
    match.student2.toString() === req.user._id.toString();
  if (!isParticipant) return res.status(403).json({ message: "Access denied" });

  await match.deleteOne();
  res.json({ success: true, message: "Connection removed" });
});

// ── GET /api/match/my-matches ────────────────────────────────
// Returns accepted matches only (for chat)
const getMyMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({
    $or: [{ student1: req.user._id }, { student2: req.user._id }],
    status: "accepted",
  })
    .populate("student1", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .populate("student2", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .sort({ updatedAt: -1 });

  const buddies = matches.map((m) => {
    const other =
      m.student1._id.toString() === req.user._id.toString() ? m.student2 : m.student1;
    return { matchId: m._id, buddy: other, course: m.course, level: m.level, matchedAt: m.updatedAt };
  });

  res.json({ success: true, data: buddies });
});

// ── GET /api/match/pending ───────────────────────────────────
// Returns pending requests sent TO the current user (inbox)
const getPendingRequests = asyncHandler(async (req, res) => {
  const pending = await Match.find({
    student2: req.user._id,
    status: "pending",
  })
    .populate("student1", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .sort({ createdAt: -1 });

  const requests = pending.map((m) => ({
    matchId: m._id,
    from: m.student1,
    course: m.course,
    level: m.level,
    sentAt: m.createdAt,
  }));

  res.json({ success: true, data: requests });
});

// ── GET /api/match/sent ──────────────────────────────────────
// Returns pending requests sent BY the current user (outbox)
const getSentRequests = asyncHandler(async (req, res) => {
  const sent = await Match.find({
    student1: req.user._id,
    status: "pending",
  })
    .populate("student2", "name email learningProfile.skillTrack")
    .sort({ createdAt: -1 });

  const requests = sent.map((m) => ({
    matchId: m._id,
    to: m.student2,
    course: m.course,
    sentAt: m.createdAt,
  }));

  res.json({ success: true, data: requests });
});

module.exports = {
  findStudyBuddies,
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  removeMatch,
  getMyMatches,
  getPendingRequests,
  getSentRequests,
};
