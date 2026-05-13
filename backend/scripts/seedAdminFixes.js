require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Session = require("../models/Session");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmentor";

const seedAdminFixes = async () => {
    try {
        console.log("🌱 Seeding supplemental data for Admin fixes...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Get existing users from main seed
        const admin = await User.findOne({ role: "admin" });
        const student = await User.findOne({ role: "student", email: "john@student.com" });
        const mentor = await User.findOne({ role: "mentor", email: "sarah@pathmentor.com" });
        const mentor2 = await User.findOne({ role: "mentor", email: "michael@pathmentor.com" });

        if (!admin || !student || !mentor || !mentor2) {
            console.log("❌ Could not find required users. Please run scripts/seedData.js first.");
            process.exit(1);
        }

        // 2. Seed Chat Data
        console.log("💬 Seeding Chat data...");
        const conversation = await Conversation.findOrCreate(admin._id, student._id);

        // Clear existing messages for this conversation to avoid duplicates if re-run
        await Message.deleteMany({ conversation: conversation._id });

        const messages = await Message.insertMany([
            {
                conversation: conversation._id,
                sender: student._id,
                message: "Hello Admin, I need help with my account.",
                createdAt: new Date(Date.now() - 3600000 * 2)
            },
            {
                conversation: conversation._id,
                sender: admin._id,
                message: "Hello John, how can I assist you today?",
                createdAt: new Date(Date.now() - 3600000)
            },
            {
                conversation: conversation._id,
                sender: student._id,
                message: "I am having trouble accessing the Advanced level in my course.",
                createdAt: new Date()
            }
        ]);

        conversation.lastMessage = messages[2]._id;
        conversation.lastMessageAt = messages[2].createdAt;
        await conversation.save();
        console.log(`✅ Created conversation and ${messages.length} messages`);

        // 3. Seed Feedback Data
        console.log("⭐ Seeding Feedback data...");
        // Create a completed session with review
        const sessionDate = new Date();
        sessionDate.setDate(sessionDate.getDate() - 2);

        await Session.create({
            studentId: student._id,
            mentorId: mentor._id,
            date: sessionDate,
            status: "completed",
            meetingLink: "https://meet.jit.si/completed-session",
            studentRating: 4,
            studentComment: "Great session! Sarah explained React hooks very clearly.",
            summary: "We discussed useEffect and custom hooks."
        });

        await Session.create({
            studentId: student._id,
            mentorId: mentor2._id,
            date: new Date(Date.now() - 86400000 * 5),
            status: "completed",
            meetingLink: "https://meet.jit.si/old-session",
            studentRating: 5,
            studentComment: "Michael is an amazing designer. Loved the feedback on my portfolio.",
            summary: "Portfolio review and typography tips."
        });
        console.log("✅ Created 2 completed sessions with feedback");

        console.log("\n🎉 Supplemental seeding completed successfully!");
        console.log("You can now test:");
        console.log("1. Admin Chat Deletion at /admin/user-chat");
        console.log("2. Feedback Deletion at /admin/feedback");
        console.log("3. Mentor Reassignment at /admin/allstudents");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedAdminFixes();
