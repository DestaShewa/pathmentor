const express = require("express");
const router = express.Router();
const { guard, authorize } = require("../middleware/authMiddleware");
const { findStudyBuddies, sendMatchRequest, getMyMatches } = require("../controllers/matchController");

router.get("/buddies", guard, authorize("student"), findStudyBuddies);
router.post("/request", guard, authorize("student"), sendMatchRequest);
router.get("/my-matches", guard, authorize("student"), getMyMatches);

module.exports = router;
