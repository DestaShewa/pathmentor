const express = require("express");
const router = express.Router();
const { guard, authorize } = require("../middleware/authMiddleware");
const {
  findStudyBuddies,
  sendMatchRequest,
  acceptMatchRequest,
  rejectMatchRequest,
  removeMatch,
  getMyMatches,
  getPendingRequests,
  getSentRequests,
} = require("../controllers/matchController");

// All routes require student auth
router.get("/buddies",  guard, authorize("student"), findStudyBuddies);
router.post("/request", guard, authorize("student"), sendMatchRequest);
router.get("/my-matches", guard, authorize("student"), getMyMatches);
router.get("/pending",  guard, authorize("student"), getPendingRequests);
router.get("/sent",     guard, authorize("student"), getSentRequests);
router.put("/:id/accept", guard, authorize("student"), acceptMatchRequest);
router.put("/:id/reject", guard, authorize("student"), rejectMatchRequest);
router.delete("/:id",   guard, authorize("student"), removeMatch);

module.exports = router;
