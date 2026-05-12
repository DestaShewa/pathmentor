# Chat System Enhancement Testing Guide

## 🎯 Test Objective
Verify that all actors (Admin, Mentor, Student) can send text messages, documents, images, audio, video, and voice recordings through the enhanced chat system.

## 📋 Prerequisites

### 1. Backend Running
```bash
cd backend
npm start
```
✅ Server should be running on http://localhost:5001

### 2. Frontend Running
```bash
cd frontend
npm run dev
```
✅ Frontend should be running on http://localhost:8080

### 3. Test Accounts
You need at least:
- 1 Admin account
- 1 Mentor account
- 2 Student accounts (for study buddy testing)

## 🧪 Test Cases

### TEST 1: Admin Chat - Send Image
**Steps:**
1. Login as Admin
2. Navigate to Admin Panel → User Chat
3. Select any student or mentor from the list
4. Click the paperclip icon (📎)
5. Select an image file (JPG, PNG, GIF, or WEBP)
6. Verify image preview appears with filename and size
7. Click Send button
8. Verify image displays inline in the chat

**Expected Result:**
- ✅ Image preview shows before sending
- ✅ Image uploads successfully
- ✅ Image displays inline in chat
- ✅ Click image opens full size in new tab

---

### TEST 2: Admin Chat - Send Document
**Steps:**
1. Still in Admin Chat
2. Click paperclip icon
3. Select a PDF document
4. Verify document preview shows with file icon
5. Click Send
6. Verify document appears with download button

**Expected Result:**
- ✅ Document preview shows filename and size
- ✅ Document uploads successfully
- ✅ Document shows with file icon and download button
- ✅ Click download button downloads the file

---

### TEST 3: Admin Chat - Voice Recording
**Steps:**
1. Still in Admin Chat
2. Click the microphone icon (🎤)
3. Allow microphone access if prompted
4. Speak for 5-10 seconds
5. Verify recording timer is counting
6. Click Stop button
7. Verify voice file appears in attachments
8. Click Send
9. Verify voice message appears with play button

**Expected Result:**
- ✅ Recording starts with red pulsing indicator
- ✅ Timer counts up (0:01, 0:02, etc.)
- ✅ Stop button appears
- ✅ Voice file added to attachments
- ✅ Voice message shows with play/pause controls
- ✅ Can play the recorded audio

---

### TEST 4: Admin Chat - Multiple Files
**Steps:**
1. Click paperclip icon
2. Select 3 different files (e.g., 1 image, 1 PDF, 1 text file)
3. Verify all 3 files show in preview
4. Remove one file using the X button
5. Verify only 2 files remain
6. Type a text message: "Here are the files"
7. Click Send
8. Verify message shows text + 2 attachments

**Expected Result:**
- ✅ All selected files show in preview
- ✅ Can remove individual files
- ✅ Message sends with text + attachments
- ✅ All attachments display correctly

---

### TEST 5: Mentor Chat - Send to Student
**Steps:**
1. Logout from Admin
2. Login as Mentor
3. Navigate to Messages
4. Select a student from the list
5. Send a text message: "Hello student!"
6. Upload a PDF document (e.g., lesson material)
7. Record a voice message explaining the document
8. Send both

**Expected Result:**
- ✅ Text message sends successfully
- ✅ PDF uploads and displays
- ✅ Voice message records and sends
- ✅ Student can see all messages (test in next step)

---

### TEST 6: Student Receives Messages
**Steps:**
1. Logout from Mentor
2. Login as the Student (from TEST 5)
3. Navigate to Study Buddies (or check if there's a mentor chat)
4. Verify messages from mentor appear
5. Download the PDF
6. Play the voice message

**Expected Result:**
- ✅ All messages from mentor visible
- ✅ PDF downloads successfully
- ✅ Voice message plays correctly
- ✅ Timestamps show correctly

---

### TEST 7: Student Study Buddy Chat
**Steps:**
1. Still logged in as Student
2. Navigate to Study Buddies
3. If no buddies, send a buddy request to another student
4. Accept the request (login as other student if needed)
5. Click "Chat" button on accepted buddy
6. Send an image
7. Record a voice message
8. Type a text message
9. Send all together

**Expected Result:**
- ✅ Chat opens in side panel
- ✅ Image uploads successfully
- ✅ Voice recording works
- ✅ All items send together
- ✅ Other student sees the message in real-time

---

### TEST 8: Real-time Message Delivery
**Steps:**
1. Open two browser windows side-by-side
2. Login as Admin in Window 1
3. Login as Student in Window 2
4. In Window 1 (Admin): Open chat with the student
5. In Window 2 (Student): Open Study Buddies (if there's a way to chat with admin)
6. Send a message from Window 1
7. Verify it appears instantly in Window 2 (if applicable)

**Expected Result:**
- ✅ Messages appear in real-time
- ✅ No page refresh needed
- ✅ Attachments load correctly
- ✅ No duplicate messages

---

### TEST 9: File Type Validation
**Steps:**
1. Login as any user
2. Open any chat
3. Try to upload an unsupported file type (e.g., .exe, .zip)
4. Verify error message appears

**Expected Result:**
- ✅ Unsupported file types rejected
- ✅ Clear error message shown
- ✅ Chat remains functional

---

### TEST 10: File Size Limit
**Steps:**
1. Try to upload a file larger than 25MB
2. Verify error message appears

**Expected Result:**
- ✅ Large files rejected
- ✅ Error message shows size limit
- ✅ Can still upload smaller files

---

### TEST 11: Maximum Files Limit
**Steps:**
1. Click paperclip icon
2. Try to select 6 or more files
3. Verify only 5 files are accepted

**Expected Result:**
- ✅ Only 5 files can be attached
- ✅ Additional files ignored or error shown
- ✅ Can remove and add different files

---

### TEST 12: Voice Recording - No Microphone
**Steps:**
1. Deny microphone permission in browser
2. Click microphone icon
3. Verify error message appears

**Expected Result:**
- ✅ Clear error message about microphone access
- ✅ Chat remains functional
- ✅ Can still send text and files

---

### TEST 13: Empty Message Validation
**Steps:**
1. Try to send a message with no text and no attachments
2. Verify nothing happens or error shown

**Expected Result:**
- ✅ Cannot send empty message
- ✅ Send button disabled or no action
- ✅ No error in console

---

### TEST 14: Message with Only Attachments
**Steps:**
1. Upload a file
2. Don't type any text
3. Click Send
4. Verify message sends with only the attachment

**Expected Result:**
- ✅ Message sends successfully
- ✅ Attachment displays correctly
- ✅ No empty text bubble

---

### TEST 15: Audio File Upload (Not Recording)
**Steps:**
1. Click paperclip icon
2. Select an existing MP3 or WAV file
3. Send it
4. Verify it displays with audio player

**Expected Result:**
- ✅ Audio file uploads
- ✅ Shows with play/pause controls
- ✅ Can play the audio
- ✅ Shows filename

---

### TEST 16: Video File Upload
**Steps:**
1. Click paperclip icon
2. Select a video file (MP4, WEBM)
3. Send it
4. Verify video player appears

**Expected Result:**
- ✅ Video uploads successfully
- ✅ Video player shows with controls
- ✅ Can play the video
- ✅ Video doesn't auto-play

---

### TEST 17: Mixed Content Message
**Steps:**
1. Type: "Check out these resources:"
2. Attach 1 image
3. Attach 1 PDF
4. Record a voice message
5. Send all together

**Expected Result:**
- ✅ Text appears at top
- ✅ All 3 attachments display below
- ✅ Each attachment has correct preview
- ✅ All are functional (image viewable, PDF downloadable, audio playable)

---

### TEST 18: Connection Recovery
**Steps:**
1. Open chat and send a message
2. Disconnect internet
3. Try to send another message
4. Reconnect internet
5. Verify message sends or error shown

**Expected Result:**
- ✅ Error message when disconnected
- ✅ Auto-reconnects when internet returns
- ✅ Can send messages after reconnection
- ✅ No duplicate messages

---

### TEST 19: Mobile Responsiveness
**Steps:**
1. Open chat on mobile device or resize browser to mobile width
2. Try all features: text, file upload, voice recording
3. Verify UI is usable

**Expected Result:**
- ✅ Chat layout adapts to mobile
- ✅ Buttons are tappable
- ✅ File picker works on mobile
- ✅ Voice recording works on mobile
- ✅ Attachments display correctly

---

### TEST 20: Cross-Role Communication
**Steps:**
1. Admin sends message with file to Mentor
2. Mentor replies with voice message
3. Mentor sends message with file to Student
4. Student replies with image
5. Verify all messages received correctly

**Expected Result:**
- ✅ Admin ↔ Mentor communication works
- ✅ Mentor ↔ Student communication works
- ✅ All file types work across roles
- ✅ Real-time delivery works

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to send message"
**Solution:**
- Check backend server is running
- Check network tab for API errors
- Verify authentication token is valid
- Check file size is under 25MB

### Issue 2: "Could not access microphone"
**Solution:**
- Check browser permissions
- Allow microphone access
- Try in HTTPS (some browsers require it)
- Check if microphone is being used by another app

### Issue 3: Files not uploading
**Solution:**
- Check file type is supported
- Check file size is under 25MB
- Verify `uploads/chat/` directory exists in backend
- Check backend logs for errors

### Issue 4: Images not displaying
**Solution:**
- Check image URL is correct
- Verify backend is serving static files from `/uploads`
- Check CORS settings
- Check image file is not corrupted

### Issue 5: Voice messages not playing
**Solution:**
- Check audio format is supported by browser
- Verify audio file was created correctly
- Check browser console for errors
- Try different browser

### Issue 6: Real-time not working
**Solution:**
- Check Socket.io connection in browser console
- Verify backend Socket.io is running
- Check CORS settings for Socket.io
- Refresh both browser windows

---

## ✅ Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Smooth user experience
- ✅ Fast upload/download speeds
- ✅ Real-time message delivery
- ✅ Proper error handling
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility

---

## 📊 Test Results Template

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Admin - Send Image | ⬜ | |
| 2 | Admin - Send Document | ⬜ | |
| 3 | Admin - Voice Recording | ⬜ | |
| 4 | Admin - Multiple Files | ⬜ | |
| 5 | Mentor - Send to Student | ⬜ | |
| 6 | Student - Receive Messages | ⬜ | |
| 7 | Student - Buddy Chat | ⬜ | |
| 8 | Real-time Delivery | ⬜ | |
| 9 | File Type Validation | ⬜ | |
| 10 | File Size Limit | ⬜ | |
| 11 | Max Files Limit | ⬜ | |
| 12 | No Microphone | ⬜ | |
| 13 | Empty Message | ⬜ | |
| 14 | Only Attachments | ⬜ | |
| 15 | Audio File Upload | ⬜ | |
| 16 | Video File Upload | ⬜ | |
| 17 | Mixed Content | ⬜ | |
| 18 | Connection Recovery | ⬜ | |
| 19 | Mobile Responsive | ⬜ | |
| 20 | Cross-Role Communication | ⬜ | |

**Legend:** ⬜ Not Tested | ✅ Passed | ❌ Failed | ⚠️ Partial

---

## 🎉 Completion

Once all tests pass, the chat system is fully functional with:
- ✅ Document uploads (PDF, DOC, XLS, PPT, TXT)
- ✅ Image uploads (JPG, PNG, GIF, WEBP)
- ✅ Audio uploads (MP3, WAV, OGG, WEBM)
- ✅ Video uploads (MP4, WEBM, OGG, MOV)
- ✅ Voice recording with browser MediaRecorder
- ✅ Real-time message delivery
- ✅ Working for all roles (Admin, Mentor, Student)

**The chat system is production-ready!** 🚀
