const nodemailer = require("nodemailer");

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,   // Gmail address
                pass: process.env.EMAIL_PASS    // Gmail App Password (16-char)
            }
        });
        this.sender = `"PathMentor AI" <${process.env.EMAIL_USER}>`;
    }

    async _sendHtmlEmail(to, subject, htmlContent) {
        try {
            await this.transporter.sendMail({
                from: this.sender,
                to,
                subject,
                html: htmlContent
            });
            console.log(`[EmailService] Email sent successfully to: ${to}`);
        } catch (error) {
            console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        }
    }

    sendWelcomeEmail(user) {
        const subject = "Welcome to PathMentor AI!";
        const html = `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                <h2 style="color:#33b6ff;margin-bottom:8px;">Welcome to PathMentor, ${user.name}!</h2>
                <p style="color:#94a3b8;margin-bottom:24px;">We are thrilled to have you join our intelligent e-learning and mentorship platform.</p>
                <p style="color:#94a3b8;margin-bottom:24px;">Whether you're here to learn new skills or guide others, PathMentor will give you the tools you need.</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:8081"}/login" style="display:inline-block;padding:14px 32px;background:#33b6ff;color:#000;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">Go to Dashboard</a>
                <p style="color:#475569;font-size:12px;margin-top:32px;">If you have any questions, our support team is always here to help.</p>
            </div>
        `;
        return this._sendHtmlEmail(user.email, subject, html);
    }

    sendOtpEmail(user, otp) {
        const subject = "Your Password Reset Code — PathMentor AI";
        const html = `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                <h2 style="color:#33b6ff;margin-bottom:8px;">Password Reset Code</h2>
                <p style="color:#94a3b8;margin-bottom:24px;">Hi ${user.name}, use the code below to reset your PathMentor AI password. This code expires in <strong style="color:#fff;">10 minutes</strong>.</p>
                <div style="background:#1e293b;border:2px solid #33b6ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                    <p style="color:#94a3b8;font-size:12px;margin:0 0 8px 0;letter-spacing:2px;text-transform:uppercase;">Your OTP Code</p>
                    <p style="color:#33b6ff;font-size:40px;font-weight:bold;letter-spacing:10px;margin:0;">${otp}</p>
                </div>
                <p style="color:#475569;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
                <p style="color:#475569;font-size:11px;">Do not share this code with anyone.</p>
            </div>
        `;
        return this._sendHtmlEmail(user.email, subject, html);
    }

    sendMentorApprovalEmail(user) {
        const subject = "Congratulations! Your Mentor Application is Approved";
        const html = `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                <h2 style="color:#33b6ff;margin-bottom:8px;">Application Approved \uD83C\uDF89</h2>
                <p style="color:#94a3b8;margin-bottom:24px;">Hello ${user.name}, we are excited to inform you that your mentor application has been approved by our administrators!</p>
                <p style="color:#94a3b8;margin-bottom:24px;">You can now log in to the platform, create courses, upload lessons, and start guiding students.</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:8081"}/login" style="display:inline-block;padding:14px 32px;background:#33b6ff;color:#000;font-weight:bold;border-radius:10px;text-decoration:none;font-size:15px;">Login as Mentor</a>
                <p style="color:#475569;font-size:12px;margin-top:32px;">Welcome to the PathMentor team!</p>
            </div>
        `;
        return this._sendHtmlEmail(user.email, subject, html);
    }

    sendMentorRejectionEmail(user) {
        const subject = "Update Regarding Your Mentor Application";
        const html = `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
                <h2 style="color:#33b6ff;margin-bottom:8px;">Application Status Update</h2>
                <p style="color:#94a3b8;margin-bottom:24px;">Hello ${user.name}, after careful review, we regret to inform you that we cannot approve your mentor application at this time.</p>
                <p style="color:#94a3b8;margin-bottom:24px;">Your account has been reverted to a standard student account, so you can continue learning and growing your skills on the platform.</p>
                <p style="color:#475569;font-size:12px;margin-top:32px;">Thank you for your interest in contributing to the PathMentor community.</p>
            </div>
        `;
        return this._sendHtmlEmail(user.email, subject, html);
    }
}

module.exports = new EmailService();
