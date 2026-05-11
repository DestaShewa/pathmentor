const Activity = require("../models/Activity");

exports.logActivity = async ({ user, type, message, meta = {} }) => {
  try {
    await Activity.create({
      user,
      type,
      message,
      meta
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};