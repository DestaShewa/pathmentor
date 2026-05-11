const Message = require("../models/Message");

// GET /api/messages/room/:roomId
exports.getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) return res.status(400).json({ message: "roomId is required" });

    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).populate("sender", "name email");
    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages
exports.createMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const sender = req.user ? req.user._id : null;

    if (!roomId || !message) return res.status(400).json({ message: "roomId and message are required" });

    const newMsg = new Message({ roomId, message, sender });
    await newMsg.save();

    // populate sender info for response
    await newMsg.populate("sender", "name email");

    // emit over socket.io if available
    const io = req.app && req.app.get && req.app.get("io");
    if (io) {
      io.to(roomId).emit("newMessage", newMsg);
    }

    res.status(201).json({ message: newMsg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
