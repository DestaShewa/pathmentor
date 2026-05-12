const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const courseRoutes = require("./routes/courseRoutes");
const levelRoutes = require("./routes/levelRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const quizRoutes = require("./routes/quizRoutes");
const progressRoutes = require("./routes/progressRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const matchRoutes = require("./routes/matchRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const studyRoomRoutes = require("./routes/studyRoomRoutes");
const supportTicketRoutes = require("./routes/supportTicketRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

const PORT = process.env.PORT || 5001;

connectDB();

const app = express();

// CORS — must be before everything else
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // handle preflight for all routes

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});
app.use(limiter);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/study-rooms", studyRoomRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/conversations", conversationRoutes);

app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:8080", "http://127.0.0.1:8081"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

// Make io globally available for notifications
global.io = io;

// Initialize Socket.IO service
const { initializeSocket } = require("./services/socketService");
initializeSocket(io);

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
