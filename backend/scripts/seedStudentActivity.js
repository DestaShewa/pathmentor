const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");
const DailyProgress = require("../models/DailyProgress");

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pathmentor");
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedActivity = async () => {
    await connectDB();

    // Find a student
    const student = await User.findOne({ role: "student", email: "john@student.com" });
    if (!student) {
        console.log("Student john@student.com not found. Please run seedData.js first.");
        process.exit(1);
    }

    console.log("Seeding activity for:", student.name);

    // Clear old activity
    await DailyProgress.deleteMany({ user: student._id });

    const activities = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        activities.push({
            user: student._id,
            date: date,
            xp: Math.floor(Math.random() * 50) + 10,
            timeSpentSeconds: Math.floor(Math.random() * 3600) + 600,
            lessonsCompleted: Math.floor(Math.random() * 3) + 1
        });
    }

    await DailyProgress.insertMany(activities);
    console.log("Success: Seeded 7 days of activity!");
    process.exit();
};

seedActivity();
