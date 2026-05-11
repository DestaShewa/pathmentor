const express = require("express");
const router = express.Router();
const { guard } = require("../middleware/authMiddleware");

const {
  getAllStudyRooms,
  getStudyRoom,
  createStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  endStudyRoom,
  getMyStudyRooms
} = require("../controllers/studyRoomController");

// Get all public study rooms
router.get("/", guard, getAllStudyRooms);

// Get my study rooms (created or joined)
router.get("/my-rooms", guard, getMyStudyRooms);

// Get single study room
router.get("/:id", guard, getStudyRoom);

// Create study room
router.post("/", guard, createStudyRoom);

// Join study room
router.post("/:id/join", guard, joinStudyRoom);

// Leave study room
router.post("/:id/leave", guard, leaveStudyRoom);

// End study room (creator only)
router.put("/:id/end", guard, endStudyRoom);

module.exports = router;
