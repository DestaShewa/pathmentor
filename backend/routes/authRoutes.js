const express = require('express');
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { registerUser, loginUser, forgotPassword, resetPassword } = require("../controllers/authController");

router.post("/register", upload.single("certificate"), registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
