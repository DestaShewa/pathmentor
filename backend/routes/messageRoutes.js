const express = require("express");
const router = express.Router();
const { getMessagesByRoom, createMessage } = require("../controllers/messageController");
const { guard } = require("../middleware/authMiddleware");

// public read for room messages (admins may want to view)
router.get("/room/:roomId", guard, getMessagesByRoom);

// create new message
router.post("/", guard, createMessage);

module.exports = router;
