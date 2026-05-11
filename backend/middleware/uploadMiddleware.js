const fs   = require("fs");
const path = require("path");
const multer = require("multer");

/* ── Ensure upload directories exist ── */
const dirs = [
  path.join(__dirname, "../uploads/mentor-docs"),
  path.join(__dirname, "../uploads/lesson-files"),
];
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

/* ── Storage: mentor verification docs ── */
const mentorDocStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/mentor-docs")),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

/* ── Storage: lesson content files ── */
const lessonFileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/lesson-files")),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

/* ── File filters ── */
const pdfOnlyFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files allowed"), false);
};

const lessonFileFilter = (req, file, cb) => {
  const allowed = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Video
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    // Audio
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`File type not allowed: ${file.mimetype}`), false);
};

/* ── Multer instances ── */
const upload = multer({
  storage: mentorDocStorage,
  fileFilter: pdfOnlyFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const lessonUpload = multer({
  storage: lessonFileStorage,
  fileFilter: lessonFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

module.exports = upload;
module.exports.lessonUpload = lessonUpload;
