const Progress = require("../models/Progress");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");


/*
========================================
GET LEADERBOARD
GET /api/leaderboard
========================================
*/
const getLeaderboard = asyncHandler(async (req, res) => {

  // 🔹 Top 10 users
  const leaderboard = await Progress.aggregate([
    {
      $group: {
        _id: "$user",
        totalXP: { $sum: "$xpEarned" }
      }
    },
    {
      $sort: { totalXP: -1 }
    },
    {
      $limit: 10
    }
  ]);

  const results = [];

  for (let i = 0; i < leaderboard.length; i++) {

    const user = await User.findById(leaderboard[i]._id)
      .select("name email");

    results.push({
      rank: i + 1,
      user,
      totalXP: leaderboard[i].totalXP
    });

  }

  // 🔥 Calculate current user rank
  const userXPData = await Progress.aggregate([
    {
      $group: {
        _id: "$user",
        totalXP: { $sum: "$xpEarned" }
      }
    },
    {
      $sort: { totalXP: -1 }
    }
  ]);

  const currentUserRank = userXPData.findIndex(
    u => u._id.toString() === req.user._id.toString()
  ) + 1;

  res.json({
    success: true,
    leaderboard: results,
    yourRank: currentUserRank || null
  });

});

module.exports = {
  getLeaderboard
};
