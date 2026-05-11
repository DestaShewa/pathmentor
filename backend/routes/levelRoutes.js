const express = require("express");
const router = express.Router();
const { guard } = require("../middleware/authMiddleware");
const { getLevelsByTrack, getUnlockStatus } = require("../controllers/levelController");

router.get("/course/:courseId", getLevelsByTrack);
router.get("/:courseId/unlock-status", guard, getUnlockStatus);

module.exports = router;
