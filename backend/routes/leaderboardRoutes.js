const express = require("express");
const router = express.Router();

const { getLeaderboard } = require("../controllers/leaderboardController");
const { guard } = require("../middleware/authMiddleware");

router.get("/", guard, getLeaderboard);

module.exports = router;
