const Activity = require("../../models/Activity");

const getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const activities = await Activity.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Activity.countDocuments();

    res.json({
      activities,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRecentActivities, getAllActivities };