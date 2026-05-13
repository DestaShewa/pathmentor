require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const dbConfig = require('./config/db');

async function test() {
  await dbConfig();
  
  // Find a mentor
  const mentor = await User.findOne({ role: 'mentor' });
  console.log("Mentor:", mentor?._id, mentor?.name);
  
  // Assign a student to mentor
  const student = await User.findOne({ role: 'student' });
  student.assignedMentor = mentor._id;
  await student.save();
  console.log("Student assigned:", student.name);
  
  // Fake the request object
  const req = { user: mentor };
  const res = { 
    json: (data) => { console.log("JSON DATA:", JSON.stringify(data, null, 2)); },
    status: (code) => { console.log('Status', code); return res; }
  };
  
  const ctrl = require('./controllers/conversationController');
  await ctrl.getConversations(req, res);
  
  process.exit(0);
}
test();
