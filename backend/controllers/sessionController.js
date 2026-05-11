const Session = require("../models/Session");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { logActivity } = require("../utils/activityLogger");

// POST /api/sessions/book
const bookSession = asyncHandler(async (req, res) => {
  const { mentorId, date } = req.body;
  if (!mentorId || !date) return res.status(400).json({ message: "Mentor ID and date are required" });

  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== "mentor" || mentor.mentorVerification?.status !== "approved") {
    return res.status(404).json({ message: "Approved mentor not found" });
  }

  const sessionDate = new Date(date);
  if (sessionDate < new Date()) return res.status(400).json({ message: "Session date must be in the future" });

  const thirtyMin = 30 * 60 * 1000;
  const conflict = await Session.findOne({
    mentorId,
    status: "scheduled",
    date: { $gte: new Date(sessionDate - thirtyMin), $lte: new Date(sessionDate.getTime() + thirtyMin) }
  });
  if (conflict) return res.status(400).json({ message: "Mentor is not available at that time" });

  // Auto-generate a Jitsi meeting room name (unique per session)
  const roomName = `pathmentor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const meetingLink = `https://meet.jit.si/${roomName}`;

  const session = await Session.create({
    studentId: req.user._id,
    mentorId,
    date: sessionDate,
    status: "scheduled",
    meetingLink
  });

  logActivity({ user: req.user._id, type: "SESSION_BOOKED", message: `${req.user.name} booked a session with ${mentor.name}` }).catch(() => {});

  // Notify mentor about new session booking
  const { createNotification } = require("./notificationController");
  await createNotification({
    userId: mentorId,
    type: "info",
    title: "New Session Booked",
    message: `${req.user.name} has booked a session with you on ${sessionDate.toLocaleDateString()} at ${sessionDate.toLocaleTimeString()}`,
    link: "/mentor/sessions",
    icon: "calendar"
  }).catch(err => console.error("Failed to notify mentor:", err));

  res.status(201).json({ success: true, data: session });
});

// GET /api/sessions/my
const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ studentId: req.user._id })
    .populate("mentorId", "name email learningProfile.skillTrack")
    .sort({ date: 1 });
  res.json({ success: true, data: sessions });
});

// GET /api/sessions/mentor
const getMentorSessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({ mentorId: req.user._id })
    .populate("studentId", "name email learningProfile.skillTrack learningProfile.experienceLevel")
    .sort({ date: 1 });
  res.json({ success: true, data: sessions });
});

// PUT /api/sessions/:id/cancel
const cancelSession = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });

  const isOwner = session.studentId.toString() === req.user._id.toString() ||
    session.mentorId.toString() === req.user._id.toString();
  if (!isOwner) return res.status(403).json({ message: "Not authorized" });
  if (session.status !== "scheduled") return res.status(400).json({ message: "Only scheduled sessions can be cancelled" });

  session.status = "cancelled";
  await session.save();
  res.json({ success: true, message: "Session cancelled" });
});

// PUT /api/sessions/:id/complete
const completeSession = asyncHandler(async (req, res) => {
  const { feedback, summary } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });

  if (session.mentorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the mentor can complete a session" });
  }

  session.status = "completed";
  if (feedback) session.feedback = feedback;
  if (summary) session.summary = summary;
  await session.save();

  logActivity({ user: req.user._id, type: "SESSION_COMPLETED", message: "Session completed by mentor" }).catch(() => {});

  // Notify student that session is completed and they can rate it
  const { createNotification } = require("./notificationController");
  await createNotification({
    userId: session.studentId,
    type: "success",
    title: "Session Completed",
    message: "Your mentor has marked the session as complete. Please rate your experience!",
    link: "/sessions",
    icon: "check-circle"
  }).catch(err => console.error("Failed to notify student:", err));

  res.json({ success: true, data: session });
});

// PUT /api/sessions/:id/rate
const rateSession = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

  const session = await Session.findById(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  if (session.studentId.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Only the student can rate this session" });
  if (session.status !== "completed") return res.status(400).json({ message: "Can only rate completed sessions" });

  session.studentRating = rating;
  session.studentComment = comment || "";
  await session.save();
  res.json({ success: true, message: "Rating submitted" });
});

// GET /api/sessions/mentors
const getAvailableMentors = asyncHandler(async (req, res) => {
  const mentors = await User.find({ role: "mentor", "mentorVerification.status": "approved" })
    .select("name email learningProfile.skillTrack");
  res.json({ success: true, data: mentors });
});

// GET /api/sessions/mentor/:mentorId/availability
const getMentorAvailability = asyncHandler(async (req, res) => {
  const { mentorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD format

  if (!date) {
    return res.status(400).json({ message: "Date parameter is required (YYYY-MM-DD)" });
  }

  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== "mentor") {
    return res.status(404).json({ message: "Mentor not found" });
  }

  // Get all scheduled sessions for this mentor on the given date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedSessions = await Session.find({
    mentorId,
    status: "scheduled",
    date: { $gte: startOfDay, $lte: endOfDay }
  }).select("date").sort({ date: 1 });

  // Generate available time slots (9 AM - 5 PM, 1-hour slots)
  const slots = [];
  const workStart = 9; // 9 AM
  const workEnd = 17;  // 5 PM

  for (let hour = workStart; hour < workEnd; hour++) {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    // Check if this slot conflicts with any booked session (within 30 min buffer)
    const thirtyMin = 30 * 60 * 1000;
    const hasConflict = bookedSessions.some(session => {
      const sessionTime = new Date(session.date).getTime();
      const slotTimeMs = slotTime.getTime();
      return Math.abs(sessionTime - slotTimeMs) < thirtyMin;
    });

    slots.push({
      time: slotTime.toISOString(),
      hour: `${hour}:00`,
      available: !hasConflict && slotTime > new Date() // Also check if in the future
    });
  }

  res.json({
    success: true,
    mentor: { _id: mentor._id, name: mentor.name },
    date,
    slots
  });
});

module.exports = { bookSession, getMySessions, getMentorSessions, cancelSession, completeSession, rateSession, getAvailableMentors, getMentorAvailability };
