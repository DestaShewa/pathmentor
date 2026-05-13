const mongoose = require("mongoose");
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
  const { category, courseId } = req.query;

  // 1. Build pipeline
  const pipeline = [];

  // Filter by courseId if provided
  if (courseId) {
    pipeline.push({
      $match: { course: new mongoose.Types.ObjectId(courseId) }
    });
  }

  // If category is provided, we need to filter Progress docs by their course's category
  if (category) {
    pipeline.push(
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      { $unwind: "$courseInfo" },
      { $match: { "courseInfo.category": category } }
    );
  }

  // Group by user and sum XP
  pipeline.push(
    {
      $group: {
        _id: "$user",
        totalXP: { $sum: "$xpEarned" }
      }
    },
    { $sort: { totalXP: -1 } }
  );

  // Execute for top 10
  const leaderboard = await Progress.aggregate([...pipeline, { $limit: 10 }]);

  const results = [];
  for (let i = 0; i < leaderboard.length; i++) {
    const user = await User.findById(leaderboard[i]._id).select("name email");
    results.push({
      rank: i + 1,
      user,
      totalXP: leaderboard[i].totalXP
    });
  }

  // 2. Calculate current user rank in this specific filter
  const allRankings = await Progress.aggregate(pipeline);
  const currentUserRank = allRankings.findIndex(
    u => u._id.toString() === req.user._id.toString()
  ) + 1;

  res.json({
    success: true,
    leaderboard: results,
    yourRank: currentUserRank || null,
    categoryApplied: category || "All"
  });
});

module.exports = {
  getLeaderboard
};
