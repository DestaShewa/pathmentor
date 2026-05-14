const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { logActivity } = require("../utils/activityLogger");
const sendVerificationEmail = require("../utils/sendVerificationEmail");

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
            role,
            isVerified: false,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            verificationTokenExpiry: Date.now() + 24 * 60 * 60 * 1000
        });

        await sendVerificationEmail(user.email, user.verificationToken);

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

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

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
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

// ================= FORGOT PASSWORD =================
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to avoid email enumeration
        if (!user) {
            return res.status(200).json({ message: "If that email exists, a reset link has been sent." });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8081"}/reset-password?token=${resetToken}`;

        // Use Brevo SMTP (smtp-brevo.com) — not Gmail service
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,   // Brevo SMTP login
                pass: process.env.SMTP_PASS    // Brevo SMTP key
            }
        });

        // Send email — non-blocking, token is already saved above
        transporter.sendMail({
            from: `"PathMentor AI" <${process.env.SENDER_EMAIL}>`,
            to: user.email,
            subject: "Password Reset Request — PathMentor AI",
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                    <h2 style="color:#33b6ff;margin-bottom:8px;">Reset Your Password</h2>
                    <p style="color:#94a3b8;margin-bottom:24px;">You requested a password reset for your PathMentor AI account. Click the button below — this link expires in <strong style="color:#fff;">1 hour</strong>.</p>
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#33b6ff;color:#000;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">Reset Password</a>
                    <p style="color:#475569;font-size:12px;margin-top:32px;">If you didn't request this, you can safely ignore this email.</p>
                    <p style="color:#475569;font-size:11px;">Or copy this link: ${resetUrl}</p>
                </div>
            `
        }).catch((err) => {
            console.error("Email send error:", err.message);
        });

        res.status(200).json({ message: "If that email exists, a reset link has been sent." });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ================= RESET PASSWORD =================
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const strongPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
        if (!strongPassword.test(newPassword)) {
            return res.status(400).json({ message: "Use a strong password (uppercase, lowercase, number, symbol, 8+ chars)" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// ================= VERIFY EMAIL =================
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired verification link.' });

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Email verified! You can now log in.' });
    } catch (error) {
        console.error('Verify Email Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================= RESEND VERIFICATION =================
const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });
        if (!user) return res.status(400).json({ message: 'User not found or already verified.' });

        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(user.email, user.verificationToken);
        res.json({ message: 'Verification email resent!' });
    } catch (error) {
        console.error('Resend Verification Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification
};
