const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const DailyProgress = require("./models/DailyProgress");
const Achievement = require("./models/Achievement");
const Progress = require("./models/Progress");

dotenv.config();

const testWeeklyReport = async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/pathmentor");

    const student = await User.findOne({ role: "student", email: "john@student.com" });
    if (!student) { console.log("Student not found"); process.exit(); }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await DailyProgress.find({
        user: student._id,
        date: { $gte: oneWeekAgo }
    }).sort({ date: 1 });

    console.log("Found daily logs:", dailyLogs.length);
    dailyLogs.forEach(log => {
        console.log(`${log.date.toISOString().split('T')[0]}: XP=${log.xp}, Lessons=${log.lessonsCompleted}`);
    });

    process.exit();
};

testWeeklyReport();
