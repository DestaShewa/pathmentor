const mongoose = require("mongoose");

const dailyActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    xp: {
        type: Number,
        default: 0
    },
    timeSpentSeconds: {
        type: Number,
        default: 0
    },
    lessonsCompleted: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure one record per user per day
dailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyProgress", dailyActivitySchema);
