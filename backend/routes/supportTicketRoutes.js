const express = require("express");
const router = express.Router();
const { guard, authorize } = require("../middleware/authMiddleware");
const SupportTicket = require("../models/SupportTicket");

// ── Student/Mentor: submit a ticket ─────────────────────────
router.post("/", guard, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }
    const ticket = await SupportTicket.create({
      subject: subject.trim(),
      description: description.trim(),
      category: category || "Other",
      priority: priority || "Medium",
      submittedBy: req.user._id,
    });
    await ticket.populate("submittedBy", "name email role");
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student/Mentor: get my tickets ──────────────────────────
router.get("/my", guard, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ submittedBy: req.user._id })
      .populate("submittedBy", "name email role")
      .populate("replies.author", "name role")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: get all tickets ───────────────────────────────────
router.get("/", guard, authorize("admin"), async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .populate("submittedBy", "name email role")
      .populate("assignedTo", "name email")
      .populate("replies.author", "name role")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ success: true, data: tickets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: update ticket status/priority ────────────────────
router.put("/:id", guard, authorize("admin"), async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

    await ticket.save();
    await ticket.populate("submittedBy", "name email role");
    await ticket.populate("replies.author", "name role");
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin or ticket owner: add a reply ──────────────────────
router.post("/:id/reply", guard, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Reply message is required" });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const isAdmin = req.user.role === "admin";
    const isOwner = ticket.submittedBy.toString() === req.user._id.toString();
    if (!isAdmin && !isOwner) return res.status(403).json({ message: "Access denied" });

    ticket.replies.push({ author: req.user._id, message: message.trim(), isAdmin });
    if (isAdmin && ticket.status === "Open") ticket.status = "In Progress";
    await ticket.save();
    await ticket.populate("submittedBy", "name email role");
    await ticket.populate("replies.author", "name role");
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: delete ticket ─────────────────────────────────────
router.delete("/:id", guard, authorize("admin"), async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Ticket deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
