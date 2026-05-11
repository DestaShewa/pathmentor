const User = require("../models/User");
const Session = require("../models/Session");

const MAX_STUDENTS_PER_MENTOR = 20;

/**
 * Auto-assign the best available mentor to a student.
 *
 * Scoring:
 *  +3  skill track matches student's track
 *  +2  experience level matches student's level
 *  +2  mentor has fewer students (prefer less loaded)
 *  +1  per 0.5 avg session rating above 3.0
 *
 * Hard requirements:
 *  - role === "mentor"
 *  - mentorVerification.status === "approved"
 *  - studentCount < MAX_STUDENTS_PER_MENTOR (20)
 *
 * @param {Object} student  - Mongoose User document (student)
 * @returns {Object|null}   - Assigned mentor document, or null if none available
 */
/**
 * Auto-assign the best available mentor to a student.
 *
 * Matching priority:
 *  1. Mentor's skillTrack matches student's enrolled course title (exact, case-insensitive)
 *  2. Mentor's skillTrack partially matches course title
 *  3. Mentor's skillTrack matches student's experienceLevel
 *  4. Prefer less-loaded mentors
 *  5. Rating bonus
 *
 * Hard requirements:
 *  - role === "mentor"
 *  - mentorVerification.status === "approved"
 *  - studentCount < MAX_STUDENTS_PER_MENTOR (20)
 */
const assignMentor = async (student) => {
  const skillTrack      = student.learningProfile?.skillTrack || "";
  const courseTitle     = student.learningProfile?.course?.title || skillTrack;
  const experienceLevel = student.learningProfile?.experienceLevel || "";

  // Find all approved mentors under the cap
  const candidates = await User.find({
    role: "mentor",
    "mentorVerification.status": "approved",
    studentCount: { $lt: MAX_STUDENTS_PER_MENTOR }
  }).select("name email learningProfile studentCount");

  if (!candidates.length) return null;

  // Get avg session ratings for each mentor
  const mentorIds = candidates.map(m => m._id);
  const ratingAgg = await Session.aggregate([
    { $match: { mentorId: { $in: mentorIds }, studentRating: { $gt: 0 } } },
    { $group: { _id: "$mentorId", avg: { $avg: "$studentRating" }, count: { $sum: 1 } } }
  ]);
  const ratingMap = Object.fromEntries(ratingAgg.map(r => [r._id.toString(), r.avg]));

  // Score each candidate
  const scored = candidates.map(mentor => {
    let score = 0;
    const mentorTrack = (mentor.learningProfile?.skillTrack || "").toLowerCase();
    const courseLower = courseTitle.toLowerCase();
    const trackLower  = skillTrack.toLowerCase();

    // Exact course title match — highest priority
    if (mentorTrack && mentorTrack === courseLower) {
      score += 5;
    }
    // Partial match (e.g. mentor track "Web Development" matches course "Web Development Bootcamp")
    else if (mentorTrack && (courseLower.includes(mentorTrack) || mentorTrack.includes(courseLower))) {
      score += 3;
    }
    // Fallback: skillTrack match
    else if (trackLower && mentorTrack === trackLower) {
      score += 2;
    }

    // Experience level match
    if (experienceLevel && mentor.learningProfile?.experienceLevel?.toLowerCase() === experienceLevel.toLowerCase()) {
      score += 1;
    }

    // Prefer less loaded mentors (0–2 pts based on remaining capacity)
    const remaining = MAX_STUDENTS_PER_MENTOR - (mentor.studentCount || 0);
    score += Math.round((remaining / MAX_STUDENTS_PER_MENTOR) * 2);

    // Rating bonus
    const avgRating = ratingMap[mentor._id.toString()] || 0;
    if (avgRating > 3.0) {
      score += Math.round((avgRating - 3.0) / 0.5);
    }

    return { mentor, score };
  });

  // Sort by score descending, then by studentCount ascending as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.mentor.studentCount || 0) - (b.mentor.studentCount || 0);
  });

  const best = scored[0]?.mentor;
  if (!best) return null;

  // Assign: update student's assignedMentor and increment mentor's studentCount
  await User.findByIdAndUpdate(student._id, { assignedMentor: best._id });
  await User.findByIdAndUpdate(best._id, { $inc: { studentCount: 1 } });

  return best;
};

/**
 * Unassign a mentor from a student (e.g. when mentor is rejected or removed).
 * Decrements the mentor's studentCount and clears the student's assignedMentor.
 *
 * @param {string} studentId
 * @param {string} mentorId
 */
const unassignMentor = async (studentId, mentorId) => {
  await User.findByIdAndUpdate(studentId, { assignedMentor: null });
  await User.findByIdAndUpdate(mentorId, { $inc: { studentCount: -1 } });
};

/**
 * Reassign all students of a rejected/removed mentor to new mentors.
 *
 * @param {string} mentorId
 */
const reassignMentorStudents = async (mentorId) => {
  const students = await User.find({ assignedMentor: mentorId });
  const results = [];

  for (const student of students) {
    // Clear current assignment first
    student.assignedMentor = null;
    await student.save();

    // Try to find a new mentor
    const newMentor = await assignMentor(student);
    results.push({ student: student._id, newMentor: newMentor?._id || null });
  }

  // Reset the old mentor's count
  await User.findByIdAndUpdate(mentorId, { studentCount: 0 });

  return results;
};

module.exports = { assignMentor, unassignMentor, reassignMentorStudents, MAX_STUDENTS_PER_MENTOR };
