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
 * STRICT MATCHING: Only assigns mentors whose skillTrack matches the student's
 * enrolled course title or skillTrack. Never assigns an unrelated mentor.
 *
 * Scoring within matched mentors:
 *  +5  exact course title match
 *  +3  partial match (one contains the other)
 *  +2  prefer less-loaded mentors
 *  +1  rating bonus per 0.5 above 3.0
 *
 * Returns null if no matching mentor is available.
 */
const assignMentor = async (student) => {
  const skillTrack  = (student.learningProfile?.skillTrack || "").toLowerCase().trim();
  const courseTitle = (student.learningProfile?.course?.title || skillTrack).toLowerCase().trim();

  if (!skillTrack && !courseTitle) return null;

  // Find all approved mentors under the cap
  const candidates = await User.find({
    role: "mentor",
    "mentorVerification.status": "approved",
    studentCount: { $lt: MAX_STUDENTS_PER_MENTOR },
  }).select("name email learningProfile studentCount");

  if (!candidates.length) return null;

  // Get avg session ratings
  const mentorIds = candidates.map((m) => m._id);
  const ratingAgg = await Session.aggregate([
    { $match: { mentorId: { $in: mentorIds }, studentRating: { $gt: 0 } } },
    { $group: { _id: "$mentorId", avg: { $avg: "$studentRating" } } },
  ]);
  const ratingMap = Object.fromEntries(ratingAgg.map((r) => [r._id.toString(), r.avg]));

  // Score and FILTER — only mentors whose track matches
  const scored = [];
  for (const mentor of candidates) {
    const mentorTrack = (mentor.learningProfile?.skillTrack || "").toLowerCase().trim();
    if (!mentorTrack) continue; // skip mentors with no track set

    let score = 0;

    // Exact match
    if (mentorTrack === courseTitle || mentorTrack === skillTrack) {
      score += 5;
    }
    // Partial match (one contains the other)
    else if (
      courseTitle.includes(mentorTrack) ||
      mentorTrack.includes(courseTitle) ||
      skillTrack.includes(mentorTrack) ||
      mentorTrack.includes(skillTrack)
    ) {
      score += 3;
    }
    else {
      // No match — skip this mentor entirely (strict matching)
      continue;
    }

    // Prefer less-loaded mentors
    const remaining = MAX_STUDENTS_PER_MENTOR - (mentor.studentCount || 0);
    score += Math.round((remaining / MAX_STUDENTS_PER_MENTOR) * 2);

    // Rating bonus
    const avgRating = ratingMap[mentor._id.toString()] || 0;
    if (avgRating > 3.0) score += Math.round((avgRating - 3.0) / 0.5);

    scored.push({ mentor, score });
  }

  if (!scored.length) return null; // No matching mentor found

  // Sort by score desc, then by studentCount asc as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.mentor.studentCount || 0) - (b.mentor.studentCount || 0);
  });

  const best = scored[0].mentor;

  // Assign
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
