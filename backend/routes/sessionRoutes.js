const express = require("express");
const router = express.Router();
const { guard, authorize } = require("../middleware/authMiddleware");
const { bookSession, mentorBookSession, getMySessions, getMentorSessions, cancelSession, postponeSession, completeSession, rateSession, getAvailableMentors, getMentorAvailability } = require("../controllers/sessionController");

router.get("/mentors", guard, getAvailableMentors);
router.get("/mentor/:mentorId/availability", guard, getMentorAvailability);
router.post("/book", guard, authorize("student"), bookSession);
// Mentor booking a session for a student
router.post("/book-by-mentor", guard, authorize("mentor"), mentorBookSession);
router.get("/my", guard, authorize("student"), getMySessions);
router.put("/:id/cancel", guard, cancelSession);
router.put("/:id/postpone", guard, authorize("mentor"), postponeSession);
router.put("/:id/rate", guard, authorize("student"), rateSession);
router.get("/mentor", guard, authorize("mentor"), getMentorSessions);
router.put("/:id/complete", guard, authorize("mentor"), completeSession);

// Get single session (for joining the call)
router.get("/:id", guard, async (req, res) => {
  try {
    const Session = require("../models/Session");
    const session = await Session.findById(req.params.id)
      .populate("studentId", "name email")
      .populate("mentorId", "name email learningProfile.skillTrack");

    if (!session) return res.status(404).json({ message: "Session not found" });

    // Only the student or mentor of this session can access it
    const userId = req.user._id.toString();
    const isParticipant =
      session.studentId?._id?.toString() === userId ||
      session.mentorId?._id?.toString() === userId;

    if (!isParticipant) return res.status(403).json({ message: "Access denied" });

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mentor can update the meeting link
router.put("/:id/meeting-link", guard, authorize("mentor"), async (req, res) => {
  try {
    const Session = require("../models/Session");
    const { meetingLink } = req.body;
    if (!meetingLink) return res.status(400).json({ message: "meetingLink is required" });

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the mentor can update the meeting link" });
    }

    session.meetingLink = meetingLink;
    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a session review (admin only)
router.delete("/:id/review", guard, authorize("admin"), async (req, res) => {
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

module.exports = router;
