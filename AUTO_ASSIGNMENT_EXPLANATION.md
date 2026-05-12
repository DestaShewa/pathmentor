# Auto-Assignment System Explanation

## 🎯 How Auto-Assignment Works

### Overview
The auto-assignment system automatically assigns mentors to students based on **skill track matching** when a student enrolls in a course.

---

## 📋 Assignment Flow

### Step 1: Student Enrolls in Course
**Location:** `backend/controllers/courseController.js` (line 280-350)

When a student enrolls in a course:
```javascript
// 1. Update student's learningProfile with course info
await User.findByIdAndUpdate(userId, {
  "learningProfile.course": { _id: courseId, title: course.title },
  "learningProfile.skillTrack": course.title  // ← KEY: Sets skillTrack to course title
});

// 2. Call assignMentor function
const student = await User.findById(userId);
if (!student.assignedMentor) {
  assignedMentor = await assignMentor(student);
}
```

### Step 2: Find Matching Mentors
**Location:** `backend/utils/assignMentor.js` (line 37-120)

The `assignMentor` function:
```javascript
const assignMentor = async (student) => {
  // 1. Get student's skillTrack and course title
  const skillTrack = student.learningProfile?.skillTrack || "";
  const courseTitle = student.learningProfile?.course?.title || skillTrack;
  
  // 2. Find approved mentors under capacity (< 20 students)
  const candidates = await User.find({
    role: "mentor",
    "mentorVerification.status": "approved",
    studentCount: { $lt: 20 }
  });
  
  // 3. STRICT MATCHING: Only mentors whose skillTrack matches
  for (const mentor of candidates) {
    const mentorTrack = mentor.learningProfile?.skillTrack || "";
    
    // Exact match: +5 points
    if (mentorTrack === courseTitle || mentorTrack === skillTrack) {
      score += 5;
    }
    // Partial match: +3 points
    else if (courseTitle.includes(mentorTrack) || mentorTrack.includes(courseTitle)) {
      score += 3;
    }
    // No match: SKIP this mentor
    else {
      continue;
    }
  }
  
  // 4. Return best matching mentor or null
  return bestMentor || null;
};
```

### Step 3: Update Database
```javascript
// Assign mentor to student
await User.findByIdAndUpdate(student._id, { assignedMentor: mentor._id });

// Increment mentor's student count
await User.findByIdAndUpdate(mentor._id, { $inc: { studentCount: 1 } });
```

---

## 🔍 Why Auto-Assignment Might Not Work

### Issue 1: Mentor Has No skillTrack Set ❌
**Problem:**
```javascript
// Mentor's learningProfile
{
  skillTrack: null,  // ← NOT SET!
  experienceLevel: "intermediate"
}
```

**Solution:**
Mentors must set their `skillTrack` during onboarding or profile setup.

**Check:**
```javascript
// In MongoDB or via API
db.users.find({ role: "mentor", "learningProfile.skillTrack": null })
```

---

### Issue 2: Student Has No skillTrack Set ❌
**Problem:**
```javascript
// Student's learningProfile
{
  skillTrack: null,  // ← NOT SET!
  course: null
}
```

**Solution:**
Student must enroll in a course first. The enrollment process sets the skillTrack.

**Check:**
```javascript
// In MongoDB or via API
db.users.find({ role: "student", "learningProfile.skillTrack": null })
```

---

### Issue 3: No Matching Mentors Available ❌
**Problem:**
- Student enrolled in "Web Development"
- All mentors have skillTrack: "Data Science"
- **No match found → returns null**

**Solution:**
Ensure mentors exist for each course/track offered.

**Check:**
```javascript
// Find mentors by track
db.users.find({ 
  role: "mentor", 
  "mentorVerification.status": "approved",
  "learningProfile.skillTrack": "Web Development"
})
```

---

### Issue 4: All Mentors at Capacity ❌
**Problem:**
```javascript
// All mentors have 20+ students
{
  role: "mentor",
  studentCount: 20  // ← AT MAX CAPACITY
}
```

**Solution:**
- Increase `MAX_STUDENTS_PER_MENTOR` (currently 20)
- Approve more mentors
- Manually assign students

**Check:**
```javascript
// Find mentors at capacity
db.users.find({ 
  role: "mentor", 
  studentCount: { $gte: 20 }
})
```

---

### Issue 5: Mentor Not Approved ❌
**Problem:**
```javascript
{
  role: "mentor",
  mentorVerification: {
    status: "pending"  // ← NOT APPROVED!
  }
}
```

**Solution:**
Admin must approve mentor verification.

**Check:**
```javascript
// Find unapproved mentors
db.users.find({ 
  role: "mentor", 
  "mentorVerification.status": { $ne: "approved" }
})
```

---

### Issue 6: Assignment Called Before Course Enrollment ❌
**Problem:**
If `assignMentor` is called before the student enrolls in a course, the student has no skillTrack yet.

**Solution:**
Assignment should only happen AFTER course enrollment (which is the current implementation).

---

## 🧪 How to Test Auto-Assignment

### Test 1: Create Approved Mentor
```javascript
// 1. Register as mentor
POST /api/auth/register
{
  "name": "John Mentor",
  "email": "mentor@test.com",
  "password": "Test@1234",
  "role": "mentor"
}

// 2. Complete onboarding with skillTrack
PUT /api/users/complete-onboarding
{
  "learningProfile": {
    "skillTrack": "Web Development",
    "experienceLevel": "intermediate"
  }
}

// 3. Admin approves mentor
PUT /api/users/verify-mentor/{mentorId}
{
  "status": "approved"
}
```

### Test 2: Student Enrolls in Course
```javascript
// 1. Register as student
POST /api/auth/register
{
  "name": "Jane Student",
  "email": "student@test.com",
  "password": "Test@1234",
  "role": "student"
}

// 2. Enroll in course (auto-assignment happens here)
POST /api/courses/{courseId}/enroll

// 3. Check if mentor was assigned
GET /api/users/profile
// Response should include:
{
  "user": {
    "assignedMentor": "mentor_id_here"  // ← Should be populated
  }
}
```

### Test 3: Verify Assignment in Database
```javascript
// Check student
db.users.findOne({ email: "student@test.com" })
// Should have: assignedMentor: ObjectId("...")

// Check mentor
db.users.findOne({ email: "mentor@test.com" })
// Should have: studentCount: 1
```

---

## 🔧 Manual Assignment (Admin)

If auto-assignment fails, admin can manually assign:

**Endpoint:** `POST /api/admin/assign-mentor`
```javascript
{
  "studentId": "student_id",
  "mentorId": "mentor_id"
}
```

**Implementation:**
```javascript
// backend/routes/adminRoutes.js (line 350-385)
router.post("/assign-mentor", guard, authorize("admin"), async (req, res) => {
  const { studentId, mentorId } = req.body;
  
  // Remove from old mentor if any
  if (student.assignedMentor) {
    await unassignMentor(studentId, student.assignedMentor);
  }
  
  // Assign new mentor
  await User.findByIdAndUpdate(studentId, { assignedMentor: mentorId });
  await User.findByIdAndUpdate(mentorId, { $inc: { studentCount: 1 } });
  
  res.json({ success: true });
});
```

---

## 🐛 Debugging Auto-Assignment

### Step 1: Check Student Data
```bash
# Via API
curl -H "Authorization: Bearer {token}" http://localhost:5001/api/users/profile

# Check for:
# - learningProfile.skillTrack (should be set)
# - learningProfile.course (should be set)
# - assignedMentor (should be populated or null)
```

### Step 2: Check Available Mentors
```bash
# Via API
curl -H "Authorization: Bearer {admin_token}" http://localhost:5001/api/admin/mentor-capacity

# Check for:
# - Approved mentors
# - Mentors with skillTrack matching student's course
# - Mentors under capacity (< 20 students)
```

### Step 3: Check Backend Logs
```bash
cd backend
npm start

# Look for:
# - "Mentor auto-assign error:" (if assignment failed)
# - "Student enrolled in..." (enrollment success)
# - "was assigned to mentor..." (assignment success)
```

### Step 4: Test Manual Assignment
```bash
# Force assignment via admin endpoint
curl -X POST http://localhost:5001/api/admin/auto-assign-mentors \
  -H "Authorization: Bearer {admin_token}"

# Response shows:
# - assigned: number of successful assignments
# - failed: number of failed assignments
```

---

## 📊 Common Scenarios

### Scenario 1: Student Enrolls, Gets Mentor ✅
```
1. Student registers
2. Student enrolls in "Web Development" course
3. System finds mentor with skillTrack: "Web Development"
4. Mentor is approved and has < 20 students
5. ✅ Assignment successful
```

### Scenario 2: Student Enrolls, No Mentor Available ❌
```
1. Student registers
2. Student enrolls in "Data Science" course
3. System searches for mentors with skillTrack: "Data Science"
4. No approved mentors found OR all at capacity
5. ❌ Assignment returns null
6. Student can still use platform, but no mentor assigned
```

### Scenario 3: Mentor Gets Approved, Students Auto-Assigned ✅
```
1. Mentor registers and completes onboarding
2. Admin approves mentor
3. System finds unassigned students with matching skillTrack
4. ✅ Students automatically assigned to new mentor
```

**Code:** `backend/controllers/userController.js` (line 439-460)
```javascript
// After mentor approval
const unassignedStudents = await User.find({
  role: "student",
  assignedMentor: null,
  "learningProfile.skillTrack": mentor.learningProfile.skillTrack
});

for (const student of unassignedStudents) {
  await assignMentor(student);
}
```

---

## ✅ Best Practices

### For Admins
1. **Approve mentors promptly** - Students can't be assigned to unapproved mentors
2. **Ensure mentor skillTracks match courses** - Check mentor profiles
3. **Monitor mentor capacity** - Use `/admin/mentor-capacity` endpoint
4. **Manually assign if needed** - Use `/admin/assign-mentor` endpoint

### For Mentors
1. **Complete onboarding** - Set skillTrack during registration
2. **Keep profile updated** - Ensure skillTrack matches courses you teach
3. **Monitor student count** - Check dashboard for capacity

### For Students
1. **Enroll in a course** - Assignment happens during enrollment
2. **Check profile** - Verify assignedMentor field is populated
3. **Contact admin if no mentor** - Admin can manually assign

---

## 🔄 Re-Assignment Scenarios

### When Mentor is Rejected
**Code:** `backend/controllers/userController.js` (line 526-530)
```javascript
// All students of rejected mentor are reassigned
reassignMentorStudents(mentor._id);
```

### When Student Changes Course
**Current:** Student keeps same mentor (no auto-reassignment)
**Future Enhancement:** Could reassign based on new course

### When Mentor Reaches Capacity
**Current:** Mentor excluded from future assignments
**Future Enhancement:** Could redistribute students

---

## 📝 Summary

**Auto-assignment works when:**
- ✅ Student enrolls in a course (sets skillTrack)
- ✅ Mentor has matching skillTrack
- ✅ Mentor is approved
- ✅ Mentor has < 20 students
- ✅ System finds best match based on scoring

**Auto-assignment fails when:**
- ❌ Student has no skillTrack (hasn't enrolled)
- ❌ Mentor has no skillTrack (incomplete profile)
- ❌ No matching mentors available
- ❌ All mentors at capacity
- ❌ Mentor not approved

**Solution:**
1. Ensure mentors complete onboarding with skillTrack
2. Ensure students enroll in courses
3. Admin approves mentors promptly
4. Monitor mentor capacity
5. Use manual assignment as fallback

---

**The auto-assignment system is working as designed. Issues are typically due to missing data (skillTrack) or no available mentors.**
