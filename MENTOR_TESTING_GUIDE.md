# MENTOR DASHBOARD - TESTING GUIDE

## Prerequisites
1. Backend server running on port 5001
2. Frontend running on port 8080
3. MongoDB Atlas connected
4. At least one mentor account with approved status
5. At least one student assigned to the mentor

---

## TEST 1: Dashboard Real Data Integration

### Steps:
1. Login as a mentor
2. Navigate to Mentor Dashboard
3. Verify the following displays real data:
   - Total Students count
   - Total Courses count
   - Completed Sessions count
   - Upcoming Sessions count
4. Check the weekly activity chart shows data
5. Verify "Top Student" section shows real student (if any)
6. Check "My Courses" list shows assigned courses
7. Verify "Upcoming Sessions" shows scheduled sessions

### Expected Result:
✅ All stats show real numbers from database
✅ No "fake" or "unknown" data
✅ Chart displays actual session data
✅ Course list matches database

---

## TEST 2: My Courses UI Cleanup

### Steps:
1. Click "My Classes" in sidebar
2. Look at each course card
3. Verify only 2 action buttons: "View" and "Upload"
4. Click "View" on any course
5. Check the course details header

### Expected Result:
✅ No "Analytics" or "Stats" button on course cards
✅ No "Analytics" button in course details header
✅ Clean, simplified UI
✅ Only essential actions visible

---

## TEST 3: Assign Project

### Steps:
1. Navigate to "Projects" in sidebar
2. Click "Assign Project" button
3. Fill in:
   - Title: "Build a REST API"
   - Description: "Create a RESTful API with authentication"
   - Instructions: "Use Node.js and Express..."
   - Due Date: Select tomorrow at 5 PM
4. Select at least one student from the list
5. Click "Assign Project"
6. Verify project appears in the list
7. Click expand arrow to view details
8. Check assigned students are listed

### Expected Result:
✅ Project created successfully
✅ Toast notification appears
✅ Project shows in list with correct details
✅ Due date displays correctly
✅ Assigned students visible
✅ Student receives notification (check student account)

### Test Grading:
1. Have a student submit the project
2. As mentor, expand the project
3. Click "Grade" on the submission
4. Enter grade: "A"
5. Enter feedback: "Excellent work!"
6. Submit grade

### Expected Result:
✅ Grade saved successfully
✅ Submission status changes to "reviewed"
✅ Grade and feedback display
✅ Student receives notification

---

## TEST 4: Sessions System

### Test 4A: Join Session Logic

#### Setup:
1. Book a session for 10 minutes from now
2. Navigate to "Sessions" page

#### Test Timeline:
**20 minutes before:**
- Expected: "In 20m" text, no Join button

**10 minutes before:**
- Expected: "Join Session" button appears
- Click button
- Expected: Opens meeting link or video room

**5 minutes after start:**
- Expected: "Join Session" button still available

**65 minutes after start:**
- Expected: Join button disabled

### Test 4B: Postpone Session

#### Steps:
1. Find a scheduled session
2. Click "Postpone" button
3. Select new date/time (tomorrow at 3 PM)
4. Click "Confirm Postpone"
5. Verify session date updated
6. Check student receives notification

### Expected Result:
✅ Postpone modal opens
✅ Date picker works
✅ Session date updates in list
✅ Student notified about change
✅ No scheduling conflicts

### Test 4C: Cancel Session

#### Test Past Session:
1. Try to cancel a session that already passed
2. Expected: Error message "Cannot cancel a session that has already started or passed"

#### Test Future Session:
1. Find a future scheduled session
2. Click "Cancel"
3. Confirm cancellation
4. Verify status changes to "cancelled"

### Expected Result:
✅ Cannot cancel past sessions
✅ Can cancel future sessions
✅ Confirmation dialog appears
✅ Status updates correctly

### Test 4D: Complete Session

#### Steps:
1. Find a scheduled session
2. Click "Complete"
3. Enter summary: "Covered React hooks and state management"
4. Enter feedback: "Great progress! Practice more with useEffect"
5. Click "Mark Complete"
6. Verify status changes to "completed"
7. Check student can now rate the session

### Expected Result:
✅ Complete modal opens
✅ Summary and feedback saved
✅ Status changes to "completed"
✅ Student receives notification
✅ Student can rate session

---

## TEST 5: Chat System Stability

### Test 5A: Normal Chat

#### Steps:
1. Navigate to Messages/Chat
2. Select a conversation
3. Verify connection status shows "Connected" (green)
4. Send a message: "Hello, how are you?"
5. Verify message appears immediately
6. Send another message
7. Check no duplicate messages

### Expected Result:
✅ Connection status: Connected (green Wifi icon)
✅ Messages send instantly
✅ No duplicates
✅ Online count displays

### Test 5B: Reconnection

#### Steps:
1. Open chat room
2. Disconnect your internet/WiFi
3. Observe connection status
4. Wait 2-3 seconds
5. Reconnect internet
6. Observe status change

### Expected Result:
✅ Status changes to "Disconnected" (red)
✅ After 2 seconds: "Reconnecting..." (yellow spinner)
✅ After reconnect: "Connected" (green)
✅ Can send messages again
✅ No error messages

### Test 5C: Message Persistence

#### Steps:
1. Send several messages
2. Refresh the page
3. Navigate back to chat
4. Verify all messages still visible

### Expected Result:
✅ All messages persist
✅ Message history loads correctly
✅ No messages lost

### Test 5D: Cross-Role Chat

#### Test Mentor ↔ Student:
1. Login as mentor
2. Send message to student
3. Login as student
4. Verify message received
5. Reply as student
6. Login as mentor
7. Verify reply received

#### Test Mentor ↔ Admin:
1. Login as mentor
2. Send message to admin
3. Login as admin
4. Verify message received

### Expected Result:
✅ Messages work between all roles
✅ No "blocked" or "disconnected" states
✅ Real-time delivery
✅ Persistent conversations

---

## INTEGRATION TESTS

### Test: Complete Mentor Workflow

1. **Login as Mentor**
2. **Check Dashboard** - Verify real stats
3. **View My Classes** - Check courses
4. **Assign Project** - Create and assign
5. **Schedule Session** - Book with student
6. **Join Session** - Test join logic
7. **Complete Session** - Add summary/feedback
8. **Grade Project** - Review submission
9. **Send Message** - Chat with student
10. **Postpone Session** - Reschedule upcoming

### Expected Result:
✅ All features work end-to-end
✅ No errors in console
✅ Smooth navigation
✅ Real-time updates
✅ Notifications sent correctly

---

## COMMON ISSUES & SOLUTIONS

### Issue: "Cannot cancel session"
**Solution:** Check if session time has passed. Mentors can only cancel future sessions.

### Issue: Join button not appearing
**Solution:** Check system time. Button appears 15 minutes before session.

### Issue: Chat shows "Disconnected"
**Solution:** Check backend server is running. Wait for auto-reconnect (2 seconds).

### Issue: Project assignment fails
**Solution:** Verify at least one student is selected and all required fields filled.

### Issue: No students in project assignment
**Solution:** Ensure students are assigned to mentor based on skill track.

---

## PERFORMANCE CHECKS

### Dashboard Load Time
- Expected: < 2 seconds
- Check: Network tab for API calls

### Chat Message Delivery
- Expected: < 500ms
- Check: Message timestamp

### Session List Load
- Expected: < 1 second
- Check: Spinner duration

### Project Creation
- Expected: < 1 second
- Check: Toast notification timing

---

## BROWSER COMPATIBILITY

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Edge (latest)
- ✅ Safari (latest)

---

## MOBILE RESPONSIVENESS

Test on:
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

Check:
- Sidebar collapses on mobile
- Modals are scrollable
- Buttons are touch-friendly
- Text is readable

---

## FINAL CHECKLIST

- [ ] All dashboard stats show real data
- [ ] Analytics buttons removed from courses
- [ ] Project assignment works
- [ ] Project grading works
- [ ] Session join logic correct (15 min before)
- [ ] Session postpone works
- [ ] Session cancel validates time
- [ ] Session complete saves summary
- [ ] Chat connects successfully
- [ ] Chat auto-reconnects
- [ ] Chat works across all roles
- [ ] No duplicate messages
- [ ] Notifications sent correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] All CRUD operations work

---

**Testing Complete! 🎉**

If all tests pass, the Mentor Dashboard System is fully functional and ready for production.
