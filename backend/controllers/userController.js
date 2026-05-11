const User = require("../models/User");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/asyncHandler");
const { logActivity } = require("../utils/activityLogger");
const { assignMentor } = require("../utils/assignMentor");

const getMyProfile= async (req,res) => {
        res.status(200).json({
            user: req.user
        });
};

// update user profile
const updateMyProfile = async (req, res) => {
  try {
    const { name, skill, level } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (skill) updates["learningProfile.skillTrack"] = skill;
    if (level) updates["learningProfile.experienceLevel"] = level;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// change the password
const changePassword = async (req, res) =>{
  try{
    const {currentPassword, newPassword } = req.body;

    // check input
    if(!currentPassword || !newPassword) {
      return res.status(400).json({
        message : "All fields are required"
      });
    }

    // get user with password
    const user = await User.findById(req.user._id).select("+password");

    //compare old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
        // 4️⃣ Validate new password strength
    const strongPassword =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(newPassword)) {
      return res.status(400).json({
        message:
          "Use Strong Password"
      });
    }

    // 5️⃣ Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 6️⃣ Save user
    await user.save();

    res.status(200).json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }

}

// onboarding data 
const completeProfile = async (req, res) => {
  try {
    const {
      skillTrack,
      experienceLevel,
      commitmentTime,
      learningStyle,
      learningGoal,
      personalGoal,
      persona,
      strengths,
      recommendation
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const uploadedFiles = req.files || [];
    const uploadedPaths = uploadedFiles.map((file) => `/uploads/mentor-docs/${file.filename}`);

    const strengthsArray = Array.isArray(strengths)
      ? strengths
      : typeof strengths === "string"
      ? strengths
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    // Skill track ID → human-readable label map (matches SKILL_OPTIONS in frontend)
    const SKILL_TRACK_LABELS = {
      full_stack:    "Full-Stack Coding",
      ui_ux:         "UI/UX Design",
      video_editing: "Video Editing",
      ai_ml:         "AI & Machine Learning",
      graphic_design:"Graphic Design",
      cybersecurity: "Cybersecurity",
      mobile_dev:    "Mobile Development",
      data_science:  "Data Science",
      cloud_devops:  "Cloud & DevOps",
    };

    // Find course based on skillTrack — try label first, then raw value
    const Course = require("../models/Course");
    let courseData = null;

    if (skillTrack) {
      const humanLabel = SKILL_TRACK_LABELS[skillTrack] || skillTrack;

      // Try exact label match first, then partial match
      let course = await Course.findOne({
        $or: [
          { title: new RegExp(`^${humanLabel}$`, "i") },
          { title: new RegExp(humanLabel, "i") },
          { category: new RegExp(humanLabel, "i") },
          { title: new RegExp(skillTrack.replace(/_/g, " "), "i") },
          { category: new RegExp(skillTrack.replace(/_/g, " "), "i") },
        ]
      });

      // Fallback: pick the first available course if no match
      if (!course) {
        course = await Course.findOne({});
      }

      if (course) {
        courseData = {
          id: course._id,
          title: course.title
        };

        // Create initial progress record
        const Progress = require("../models/Progress");
        const existingProgress = await Progress.findOne({
          user: user._id,
          course: course._id
        });

        if (!existingProgress) {
          await Progress.create({
            user: user._id,
            course: course._id,
            levelsProgress: [],
            xpEarned: 0
          });
        }
      }
    }

    user.learningProfile = {
      skillTrack,
      experienceLevel,
      commitmentTime,
      learningStyle,
      learningGoal,
      personalGoal,
      persona,
      strengths: strengthsArray,
      recommendation,
      course: courseData,
      courseLevel: experienceLevel
    };

    user.onboardingCompleted = true;
    user.mentorVerification = {
      ...user.mentorVerification,
      documents: [
        ...(user.mentorVerification?.documents || []),
        ...uploadedPaths,
      ],
    };

    await user.save();

    // Auto-assign a mentor if student doesn't already have one
    let assignedMentorData = null;
    if (user.role === "student" && !user.assignedMentor) {
      try {
        assignedMentorData = await assignMentor(user);
      } catch (assignErr) {
        console.error("Mentor assignment error:", assignErr.message);
      }
    }

    res.status(200).json({
      message: "Profile completed successfully",
      documents: user.mentorVerification.documents,
      course: courseData,
      assignedMentor: assignedMentorData
        ? { _id: assignedMentorData._id, name: assignedMentorData.name }
        : null
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

// ADMIN : get all users
const getAllUsers= async (req,res) =>{
  const users = await User.find().select("-password");
  res.json(users);

}; 

// ADMIN : get all verified mentors
const getAllMentors = asyncHandler(async (req, res) => {
  const mentors = await User.find({
    role: "mentor",
    "mentorVerification.status": "approved",
  })
    .select("-password")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: mentors.length,
    mentors,
  });
});

// ADMIN : create mentor
const createMentor = asyncHandler(async (req, res) => {
  const { name, email, password, skillTrack } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email, and password are required",
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&])[A-Za-z\d@$!%#*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters, one uppercase letter, one number, and one special character",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const mentor = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "mentor",
    learningProfile: {
      skillTrack: skillTrack || "",
    },
    onboardingCompleted: true,
    mentorVerification: {
      status: "approved",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    },
  });

  res.status(201).json({
    message: "Mentor created successfully",
    mentor: {
      _id: mentor._id,
      name: mentor.name,
      email: mentor.email,
      role: mentor.role,
      mentorVerification: mentor.mentorVerification,
    },
  });
});

// ADMIN:  delete users
 const deleteUser = async (req, res) => {
   await User.findByIdAndDelete(req.params.id);
   res.json ({ 
     message: "User deleted"
   });
 }; 
 //ADMIN: update role
 const updateUserRole = async (req, res) =>{
  const user = await User.findByIdAndUpdate (
    req.params.id,
    {role: req.body.role},
    {new: true}
  );
  res.json(user);
 }; 

//Dashboard
  const getDashboardStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const mentors = await User.countDocuments({ role: "mentor" });
  const students = await User.countDocuments({ role: "student" });
  const pending = await User.countDocuments({ role: "mentor", "mentorVerification.status": "pending" });
  const totalCourses = await Course.countDocuments();
  const activeStudents = await Progress.distinct("user").then((ids) => ids.length);
  const enrollmentCount = await Progress.countDocuments();
  const activeMentors = await Course.distinct("createdBy").then((ids) => ids.length);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const rawChart = await Progress.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt"
          }
        },
        enrollments: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const chartMap = rawChart.reduce((acc, item) => {
    acc[item._id] = item.enrollments;
    return acc;
  }, {});

  const chartData = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);
    const iso = date.toISOString().split("T")[0];
    chartData.push({
      label: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      }),
      value: chartMap[iso] || 0
    });
  }

  const recentProgress = await Progress.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("user", "name")
    .populate("course", "title");

  const liveActivity = recentProgress.map((progress) => ({
    name: progress.user?.name || "Unknown",
    course: progress.course?.title || "Course",
    message: `${progress.user?.name || "Someone"} earned ${progress.xpEarned} XP in ${progress.course?.title || "a course"}`,
    time: progress.updatedAt
  }));

  res.json({
    totalUsers,
    mentors,
    students,
    pending,
    totalCourses,
    activeStudents,
    activeMentors,
    enrollmentCount,
    chartData,
    liveActivity,
  });
};

// GET pending mentors
const getPendingMentors = asyncHandler(async (req, res) => {
  const mentors = await User.find({
    role: "mentor",
    "mentorVerification.status": "pending"
  })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(mentors);
});

// APPROVE mentor
const approveMentor = asyncHandler(async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id);

    if (!mentor) {
      return res.status(404).json({ message: "User not found" });
    }

    if (mentor.mentorVerification?.status === "approved") {
      return res.status(400).json({ message: "Already approved" });
    }

    // Update mentor status - be explicit about all fields
    mentor.role = "mentor";
    mentor.mentorVerification.status = "approved";
    mentor.mentorVerification.reviewedBy = req.user._id;
    mentor.mentorVerification.reviewedAt = new Date();
    mentor.markModified('mentorVerification'); // Force Mongoose to detect the change

    // Save and verify
    const savedMentor = await mentor.save();
    
    if (savedMentor.mentorVerification.status !== "approved") {
      throw new Error("Failed to save mentor approval status");
    }

    await logActivity({
      user: mentor._id,
      type: "MENTOR_APPROVED",
      message: `${mentor.name} was approved as mentor`,
      meta: { approvedBy: req.user._id }
    });

    // ── Auto-assign unassigned students whose skillTrack matches this mentor ──
    try {
      const { assignMentor } = require("../utils/assignMentor");
      const { createNotification } = require("./notificationController");

      const mentorTrack = mentor.learningProfile?.skillTrack?.toLowerCase();

      if (mentorTrack) {
        // Find students enrolled in a matching course who have no mentor yet
        const unassignedStudents = await User.find({
          role: "student",
          onboardingCompleted: true,
          $or: [{ assignedMentor: null }, { assignedMentor: { $exists: false } }],
          "learningProfile.skillTrack": { $regex: new RegExp(mentorTrack, "i") }
        });

        let assignedCount = 0;
        for (const student of unassignedStudents) {
          const assigned = await assignMentor(student);
          if (assigned) {
            assignedCount++;
            await createNotification({
              userId: student._id,
              type: "achievement",
              title: "Mentor Assigned! 🎉",
              message: `${assigned.name} has been assigned as your mentor.`,
              link: "/sessions",
              icon: "user"
            });
          }
        }

        if (assignedCount > 0) {
          await logActivity({
            user: req.user._id,
            type: "MENTOR_APPROVED",
            message: `${assignedCount} student(s) auto-assigned to ${mentor.name} after approval`
          });
        }
      }
    } catch (assignErr) {
      console.error("Auto-assign after approval error:", assignErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      message: "Mentor approved successfully",
      mentor: savedMentor,
    });

  } catch (error) {
    console.error("Approve mentor error:", error);
    res.status(500).json({ message: error.message });
  }
});

// REJECT mentor
const rejectMentor = asyncHandler(async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id);

    if (!mentor) {
      return res.status(404).json({ message: "User not found" });
    }

    if (mentor.mentorVerification?.status === "rejected") {
      return res.status(400).json({ message: "Already rejected" });
    }

    // Update mentor status - be explicit about all fields
    mentor.mentorVerification.status = "rejected";
    mentor.mentorVerification.reviewedBy = req.user._id;
    mentor.mentorVerification.reviewedAt = new Date();
    mentor.markModified('mentorVerification'); // Force Mongoose to detect the change

    if (mentor.role === "mentor") {
      mentor.role = "student";
    }

    // Save and verify
    const savedMentor = await mentor.save();
    
    if (savedMentor.mentorVerification.status !== "rejected") {
      throw new Error("Failed to save mentor rejection status");
    }

    // Reassign all students of this mentor to new mentors (non-blocking)
    const { reassignMentorStudents } = require("../utils/assignMentor");
    reassignMentorStudents(mentor._id.toString()).catch(err =>
      console.error("Reassignment error after rejection:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "Mentor rejected successfully",
      mentor: savedMentor,
    });

  } catch (error) {
    console.error("Reject mentor error:", error);
    res.status(500).json({ message: error.message });
  }
});



const searchMentors = asyncHandler(async (req, res) => {
  const { name, course, page = 1, limit = 10 } = req.query;

  try {
    // 🔹 Step 1: Base filter (only mentors)
    let userFilter = {
      role: "mentor"
    };

    // 🔹 Step 2: Name search (case-insensitive)
    if (name) {
      userFilter.name = { $regex: name, $options: "i" };
    }

    let mentors = [];

    // 🔹 Step 3: If course search exists
    if (course) {
      // find courses matching input
      const courses = await Course.find({
        title: { $regex: course, $options: "i" }
      });

      // extract mentor IDs
      const mentorIds = courses.map(c => c.instructor);

      userFilter._id = { $in: mentorIds };
    }

    // 🔹 Step 4: Pagination
    const skip = (page - 1) * limit;

    mentors = await User.find(userFilter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    // 🔹 Step 5: total count (for frontend pagination)
    const total = await User.countDocuments(userFilter);

    res.json({
      mentors,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports= { getMyProfile,
                  updateMyProfile, 
                  changePassword,
                  completeProfile,
                  getAllUsers,
                  getAllMentors,
                  createMentor,
                  deleteUser,
                  updateUserRole,
                  getDashboardStats,
                  getPendingMentors,
                  approveMentor,
                  rejectMentor,
                  searchMentors
   
 };