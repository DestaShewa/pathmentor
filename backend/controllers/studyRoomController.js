const StudyRoom = require("../models/StudyRoom");
const asyncHandler = require("../middleware/asyncHandler");
const { createNotification } = require("./notificationController");

/*
========================================
GET ALL STUDY ROOMS
GET /api/study-rooms
========================================
*/
const getAllStudyRooms = asyncHandler(async (req, res) => {
  const { status = "active", topic, limit = 20 } = req.query;

  const query = { isPublic: true };
  
  if (status) {
    query.status = status;
  }

  if (topic) {
    query.topic = new RegExp(topic, "i");
  }

  const rooms = await StudyRoom.find(query)
    .populate("creator", "name email learningProfile")
    .populate("course", "title")
    .populate("level", "title")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: rooms
  });
});

/*
========================================
GET SINGLE STUDY ROOM
GET /api/study-rooms/:id
========================================
*/
const getStudyRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id)
    .populate("creator", "name email learningProfile")
    .populate("participants", "name email learningProfile")
    .populate("activeParticipants", "name email")
    .populate("course", "title")
    .populate("level", "title");

  if (!room) {
    res.status(404);
    throw new Error("Study room not found");
  }

  res.json({
    success: true,
    data: room
  });
});

/*
========================================
CREATE STUDY ROOM
POST /api/study-rooms
========================================
*/
const createStudyRoom = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    topic,
    course,
    level,
    maxParticipants,
    scheduledFor,
    isPublic,
    tags
  } = req.body;

  if (!name || !topic) {
    res.status(400);
    throw new Error("Name and topic are required");
  }

  const room = await StudyRoom.create({
    name,
    description,
    topic,
    course,
    level,
    creator: req.user._id,
    participants: [req.user._id],
    activeParticipants: [req.user._id],
    maxParticipants: maxParticipants || 10,
    scheduledFor,
    isPublic: isPublic !== false,
    tags: tags || [],
    status: scheduledFor ? "scheduled" : "active"
  });

  await room.populate("creator", "name email");

  res.status(201).json({
    success: true,
    data: room,
    message: "Study room created successfully"
  });
});

/*
========================================
JOIN STUDY ROOM
POST /api/study-rooms/:id/join
========================================
*/
const joinStudyRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Study room not found");
  }

  if (room.status === "ended") {
    res.status(400);
    throw new Error("This study room has ended");
  }

  if (room.participants.includes(req.user._id)) {
    // Already a participant, just mark as active
    if (!room.activeParticipants.includes(req.user._id)) {
      room.activeParticipants.push(req.user._id);
      await room.save();
    }

    return res.json({
      success: true,
      message: "Already in room",
      data: room
    });
  }

  if (room.participants.length >= room.maxParticipants) {
    res.status(400);
    throw new Error("Study room is full");
  }

  room.participants.push(req.user._id);
  room.activeParticipants.push(req.user._id);
  await room.save();

  // Notify room creator
  if (room.creator.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: room.creator,
      type: "message",
      title: "New Participant",
      message: `${req.user.name} joined your study room "${room.name}"`,
      link: `/study-rooms/${room._id}`,
      icon: "userPlus"
    });
  }

  // Emit Socket.io event
  const io = global.io;
  if (io) {
    io.to(`room-${room._id}`).emit("participantJoined", {
      userId: req.user._id,
      userName: req.user.name
    });
  }

  res.json({
    success: true,
    message: "Joined study room successfully",
    data: room
  });
});

/*
========================================
LEAVE STUDY ROOM
POST /api/study-rooms/:id/leave
========================================
*/
const leaveStudyRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Study room not found");
  }

  // Remove from active participants
  room.activeParticipants = room.activeParticipants.filter(
    (p) => p.toString() !== req.user._id.toString()
  );

  await room.save();

  // Emit Socket.io event
  const io = global.io;
  if (io) {
    io.to(`room-${room._id}`).emit("participantLeft", {
      userId: req.user._id,
      userName: req.user.name
    });
  }

  res.json({
    success: true,
    message: "Left study room"
  });
});

/*
========================================
END STUDY ROOM
PUT /api/study-rooms/:id/end
========================================
*/
const endStudyRoom = asyncHandler(async (req, res) => {
  const room = await StudyRoom.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Study room not found");
  }

  // Only creator can end the room
  if (room.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the creator can end this room");
  }

  room.status = "ended";
  room.activeParticipants = [];
  await room.save();

  // Emit Socket.io event
  const io = global.io;
  if (io) {
    io.to(`room-${room._id}`).emit("roomEnded");
  }

  res.json({
    success: true,
    message: "Study room ended",
    data: room
  });
});

/*
========================================
GET MY STUDY ROOMS
GET /api/study-rooms/my-rooms
========================================
*/
const getMyStudyRooms = asyncHandler(async (req, res) => {
  const rooms = await StudyRoom.find({
    $or: [
      { creator: req.user._id },
      { participants: req.user._id }
    ]
  })
    .populate("creator", "name email")
    .populate("course", "title")
    .populate("level", "title")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: rooms
  });
});

/*
========================================
UPDATE ACTIVE PARTICIPANTS (INTERNAL)
Used by Socket.io to track who's online
========================================
*/
const updateActiveParticipants = async (roomId, userId, action) => {
  try {
    const room = await StudyRoom.findById(roomId);
    if (!room) return;

    if (action === "add") {
      if (!room.activeParticipants.includes(userId)) {
        room.activeParticipants.push(userId);
      }
    } else if (action === "remove") {
      room.activeParticipants = room.activeParticipants.filter(
        (p) => p.toString() !== userId.toString()
      );
    }

    await room.save();
    return room;
  } catch (err) {
    console.error("Failed to update active participants:", err);
  }
};

module.exports = {
  getAllStudyRooms,
  getStudyRoom,
  createStudyRoom,
  joinStudyRoom,
  leaveStudyRoom,
  endStudyRoom,
  getMyStudyRooms,
  updateActiveParticipants
};
