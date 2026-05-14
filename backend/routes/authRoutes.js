const express = require('express');
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const { registerUser, loginUser, forgotPassword, resetPassword, verifyEmail, resendVerification } = require("../controllers/authController");

router.post("/register", upload.single("certificate"), registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

module.exports = router;
