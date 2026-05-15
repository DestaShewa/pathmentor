const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../utils/emailService");
const { logActivity } = require("../utils/activityLogger");

// ================= REGISTER =================
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        if (!["student", "mentor"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character (@$!%#*?&)"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send Welcome Email
        emailService.sendWelcomeEmail(user);

        // Non-blocking activity log — never crash the response
        logActivity({
            user: user._id,
            type: "USER_REGISTERED",
            message: `${user.name} joined the platform`
        }).catch(() => {});

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                onboardingCompleted: user.onboardingCompleted,
                mentorVerification: {
                    status: user.mentorVerification?.status ?? null
                }
            }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                onboardingCompleted: user.onboardingCompleted,
                mentorVerification: {
                    status: user.mentorVerification?.status ?? null
                }
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ================= FORGOT PASSWORD (OTP) =================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to avoid email enumeration
        if (!user) {
            return res.status(200).json({ message: "If that email exists, an OTP has been sent." });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        user.passwordResetOtp = hashedOtp;
        user.passwordResetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP email — non-blocking
        emailService.sendOtpEmail(user, otp);

        res.status(200).json({ message: "OTP sent to your email. It expires in 10 minutes." });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ================= RESET PASSWORD (OTP) =================
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, OTP, and new password are required" });
        }

        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        const user = await User.findOne({
            email: email.toLowerCase(),
            passwordResetOtp: hashedOtp,
            passwordResetOtpExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
        }

        const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!strongPassword.test(newPassword)) {
            return res.status(400).json({ message: "Use a strong password (uppercase, lowercase, number, symbol, 8+ chars)" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetOtp = null;
        user.passwordResetOtpExpires = null;
        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
};
