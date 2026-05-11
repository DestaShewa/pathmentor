const User = require("../../models/User");
const Course = require("../../models/Course");
const Progress = require("../../models/Progress");
const Activity = require("../../models/Activity");
const asyncHandler = require("../../middleware/asyncHandler");

/*
========================================
GET ADMIN DASHBOARD STATS
========================================
*/
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get user counts by role
  const [totalStudents, totalMentors, totalAdmins] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "mentor", "mentorVerification.status": "approved" }),
    User.countDocuments({ role: "admin" })
  ]);

  // Get pending mentor applications
  const pendingMentors = await User.countDocuments({
    role: "mentor",
    "mentorVerification.status": "pending"
  });

  // Get course stats
  const totalCourses = await Course.countDocuments();
  const totalEnrollments = await Progress.countDocuments();

  // Get active users (logged in within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: sevenDaysAgo }
  });

  // Get weekly growth data (last 7 days)
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayUsers = await User.countDocuments({
      createdAt: { $gte: date, $lt: nextDate }
    });

    weeklyData.push({
      date: date.toISOString().split('T')[0],
      users: dayUsers
    });
  }

  // Get chart data for visualization (monthly growth)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthUsers = await User.countDocuments({
      createdAt: { $gte: date, $lt: nextMonth }
    });

    const monthName = date.toLocaleString('default', { month: 'short' });
    chartData.push({
      month: monthName,
      value: monthUsers
    });
  }

  // Get system health metrics
  const systemHealth = {
    totalUsers: totalStudents + totalMentors + totalAdmins,
    activeUsers,
    totalCourses,
    totalEnrollments,
    pendingMentors,
    avgEnrollmentsPerCourse: totalCourses > 0 ? Math.round(totalEnrollments / totalCourses) : 0
  };

  res.json({
    success: true,
    stats: {
      totalStudents,
      totalMentors,
      totalAdmins,
      pendingMentors,
      totalCourses,
      totalEnrollments,
      activeUsers
    },
    weeklyData,
    chartData,
    systemHealth
  });
});

module.exports = {
  getDashboardStats
};
