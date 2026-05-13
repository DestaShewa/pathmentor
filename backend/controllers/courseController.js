const Course= require("../models/Course");
const Level = require("../models/Level");
const asyncHandler = require("../middleware/asyncHandler");
const Lesson = require("../models/Lesson");
const { logActivity } = require("../utils/activityLogger");


const createCourse = asyncHandler(async (req, res)=> {
  const { title, description, category } = req.body;
  if (!title) return res.status(400).json({ success: false, message: "Course title is required" });
  if (!category) return res.status(400).json({ success: false, message: "Course category is required" });

  const course = new Course ({
    title: title,
    description: description,
    category: category,
    createdBy: req.user._id,
    instructor: req.body.instructorId || undefined,
  });
  await course.save();

  await logActivity({
    user: req.user._id,
    type: "COURSE_CREATED",
    message: `New course "${course.title}" created`
  });

  // ── Auto-assign course to mentor based on skillTrack match ──────────────
  if (!course.instructor) {
    try {
      const User = require("../models/User");
      
      // Find mentors whose skillTrack matches the course title or category
      const courseKeywords = [course.title, course.category].filter(Boolean).join(" ").toLowerCase();
      
      const matchingMentors = await User.find({
        role: "mentor",
        "mentorVerification.status": "approved"
      }).select("name learningProfile.skillTrack studentCount");

      // Score mentors by match quality and availability
      const scoredMentors = matchingMentors.map(mentor => {
        const mentorTrack = (mentor.learningProfile?.skillTrack || "").toLowerCase();
        let score = 0;

        // Exact match
        if (mentorTrack === course.title.toLowerCase()) score += 100;
        // Partial match in course title
        else if (courseKeywords.includes(mentorTrack)) score += 80;
        // Partial match in mentor track
        else if (mentorTrack && courseKeywords.includes(mentorTrack)) score += 60;
        // Category match
        else if (mentorTrack === (course.category || "").toLowerCase()) score += 40;

        // Prefer mentors with fewer students (load balancing)
        const loadPenalty = (mentor.studentCount || 0) * 2;
        score -= loadPenalty;

        return { mentor, score };
      });

      // Get best matching mentor
      const bestMatch = scoredMentors
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)[0];

      if (bestMatch) {
        course.instructor = bestMatch.mentor._id;
        await course.save();

        await logActivity({
          user: req.user._id,
          type: "COURSE_CREATED",
          message: `Course "${course.title}" auto-assigned to mentor ${bestMatch.mentor.name}`
        });
      }
    } catch (err) {
      console.error("Auto-assign course to mentor error:", err.message);
      // Don't fail course creation if auto-assign fails
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const defaultLevels = [
    "Awareness",
    "Beginner",
    "Fundamental",
    "Intermediate",
    "Advanced",
    "Proficient",
    "Mastery"
  ];

  const levelPromises = defaultLevels.map((levelName, index) => {
    return Level.create({
      title: levelName,
      order: index + 1,
      course: course._id
    });
  });

  await Promise.all(levelPromises);

  res.status(201).json({
    success: true,
    message: "Track created with default levels",
    data: course
  });
});

const getCourseRoadmap = asyncHandler(async (req, res) => {

  const courseId = req.params.id;

  const levels = await Level.find({
    course: courseId
  })
  .sort({ order: 1 })
  .lean();

  for (let level of levels) {

    level.lessons = await Lesson.find({
      level: level._id
    })
    .sort({ order: 1 });

  }

  res.json({
    success: true,
    levels
  });

});

const adminGetCourses = asyncHandler(async (req, res) => {
  const { search, mentorId, category, page = 1, limit = 10 } = req.query;
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex }
    ];
  }

  if (mentorId) {
    query.instructor = mentorId;
  }

  if (category) {
    query.category = category;
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

  const total = await Course.countDocuments(query);
  const courses = await Course.find(query)
    .populate("instructor")
    .populate("createdBy")
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  res.json({
    success: true,
    data: courses,
    total,
    page: pageNumber,
    pages: Math.max(Math.ceil(total / pageSize), 1),
  });
});

const adminDeleteCourse = async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: "Course deleted" });
};

const adminUpdateCourse = asyncHandler(async (req, res) => {
  try {
    const courseId = req.params.id;

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Map instructorId to instructor field
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      instructor: req.body.instructorId || req.body.instructor
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    ).populate("instructor", "name email learningProfile");

    if (!course) {
      return res.status(404).json({ success: false, message: "Failed to update course" });
    }

    await logActivity({
      user: req.user._id,
      type: "COURSE_UPDATED",
      message: `Course "${course.title}" was updated`
    });

    res.json({ success: true, message: "Course updated successfully", data: course });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update course" });
  }
});


// GET /api/courses - Get all available courses for students
const getAllCourses = asyncHandler(async (req, res) => {
  // Only show courses that were created by an admin account
  const User = require("../models/User");
  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((a) => a._id);

  const courses = await Course.find({ createdBy: { $in: adminIds } })
    .populate("instructor", "name email learningProfile")
    .sort({ createdAt: -1 })
    .lean();

  // Add lesson count for each course
  for (let course of courses) {
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    course.lessonCount = lessonCount;
  }

  res.json({
    success: true,
    data: courses
  });
});

// POST /api/courses/:id/enroll - Enroll student in a course
const enrollInCourse = asyncHandler(async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user._id;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  const User = require("../models/User");
  const Progress = require("../models/Progress");

  // Check if already enrolled in this course
  const existingProgress = await Progress.findOne({ user: userId, course: courseId });
  if (existingProgress) {
    return res.status(400).json({
      success: false,
      message: "You are already enrolled in this course"
    });
  }

  // Check if enrolled in another course (optional: allow only one active course)
  const activeEnrollment = await Progress.findOne({ user: userId });
  if (activeEnrollment) {
    return res.status(400).json({
      success: false,
      message: "You are already enrolled in another course. Complete it first or contact support to switch courses."
    });
  }

  // Update user's learning profile with course info + skillTrack from course title
  await User.findByIdAndUpdate(userId, {
    "learningProfile.course": {
      id: course._id,
      title: course.title
    },
    // Use course title as skillTrack so mentor matching works
    "learningProfile.skillTrack": course.title
  });

  // Create initial progress record
  const progress = await Progress.create({
    user: userId,
    course: courseId,
    levelsProgress: [],
    xpEarned: 0
  });

  await logActivity({
    user: userId,
    type: "COURSE_ENROLLED",
    message: `Student enrolled in "${course.title}"`
  });

  // ── Auto-assign mentor based on course ──────────────────────────
  let assignedMentor = null;
  try {
    const { assignMentor } = require("../utils/assignMentor");
    const { createNotification } = require("./notificationController");

    // Get the updated student document (with new skillTrack)
    const student = await User.findById(userId);

    // Only assign if not already assigned
    if (!student.assignedMentor) {
      assignedMentor = await assignMentor(student);

      if (assignedMentor) {
        // Notify the student
        await createNotification({
          userId,
          type: "achievement",
          title: "Mentor Assigned! 🎉",
          message: `${assignedMentor.name} has been assigned as your mentor for ${course.title}.`,
          link: "/sessions",
          icon: "user"
        });

        await logActivity({
          user: userId,
          type: "MENTOR_ASSIGNED",
          message: `${student.name} was assigned to mentor ${assignedMentor.name} for "${course.title}"`
        });
      }
    } else {
      // Already has a mentor — fetch their info for the response
      assignedMentor = await User.findById(student.assignedMentor).select("name email learningProfile.skillTrack");
    }
  } catch (err) {
    // Mentor assignment is non-critical — don't fail the enrollment
    console.error("Mentor auto-assign error:", err.message);
  }
  // ────────────────────────────────────────────────────────────────

  res.json({
    success: true,
    message: "Successfully enrolled in course",
    data: {
      course,
      progress,
      assignedMentor: assignedMentor
        ? { _id: assignedMentor._id, name: assignedMentor.name, skillTrack: assignedMentor.learningProfile?.skillTrack }
        : null
    }
  });
});

module.exports = { 
  createCourse, 
  getCourseRoadmap,
  adminGetCourses,
  adminDeleteCourse,
  adminUpdateCourse,
  getAllCourses,
  enrollInCourse
};