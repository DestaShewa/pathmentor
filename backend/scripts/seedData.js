/**
 * Seed script for PathMentor-AI platform
 * Creates sample data for testing the e-learning and mentorship features
 * 
 * Usage: node scripts/seedData.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/User");
const Course = require("../models/Course");
const Level = require("../models/Level");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const Progress = require("../models/Progress");
const Session = require("../models/Session");
const Project = require("../models/Project");
const Announcement = require("../models/Announcement");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmentor";

const seedData = async () => {
  try {
    console.log("🌱 Starting data seeding...");
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Level.deleteMany({}),
      Lesson.deleteMany({}),
      Quiz.deleteMany({}),
      Progress.deleteMany({}),
      Session.deleteMany({}),
      Project.deleteMany({}),
      Announcement.deleteMany({})
    ]);
    console.log("✅ Existing data cleared");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Test@123", salt);

    // Create Admin
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      name: "Admin User",
      email: "admin@pathmentor.com",
      password: hashedPassword,
      role: "admin",
      onboardingCompleted: true
    });
    console.log("✅ Admin created:", admin.email);

    // Create Mentors
    console.log("👨‍🏫 Creating mentors...");
    const mentors = await User.insertMany([
      {
        name: "Sarah Johnson",
        email: "sarah@pathmentor.com",
        password: hashedPassword,
        role: "mentor",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "Full-Stack Coding",
          experienceLevel: "Advanced",
          commitmentTime: "20h/week"
        },
        mentorVerification: {
          status: "approved",
          reviewedBy: admin._id,
          reviewedAt: new Date()
        },
        studentCount: 0
      },
      {
        name: "Michael Chen",
        email: "michael@pathmentor.com",
        password: hashedPassword,
        role: "mentor",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "UI/UX Design",
          experienceLevel: "Proficient",
          commitmentTime: "15h/week"
        },
        mentorVerification: {
          status: "approved",
          reviewedBy: admin._id,
          reviewedAt: new Date()
        },
        studentCount: 0
      },
      {
        name: "Emily Rodriguez",
        email: "emily@pathmentor.com",
        password: hashedPassword,
        role: "mentor",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "Data Science",
          experienceLevel: "Advanced",
          commitmentTime: "25h/week"
        },
        mentorVerification: {
          status: "approved",
          reviewedBy: admin._id,
          reviewedAt: new Date()
        },
        studentCount: 0
      }
    ]);
    console.log(`✅ Created ${mentors.length} mentors`);

    // Create Students
    console.log("👨‍🎓 Creating students...");
    const students = await User.insertMany([
      {
        name: "John Doe",
        email: "john@student.com",
        password: hashedPassword,
        role: "student",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "Full-Stack Coding",
          experienceLevel: "Beginner",
          commitmentTime: "10h/week",
          learningStyle: "Visual",
          learningGoal: "Career Change"
        },
        assignedMentor: mentors[0]._id
      },
      {
        name: "Jane Smith",
        email: "jane@student.com",
        password: hashedPassword,
        role: "student",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "UI/UX Design",
          experienceLevel: "Intermediate",
          commitmentTime: "15h/week",
          learningStyle: "Hands-on",
          learningGoal: "Skill Enhancement"
        },
        assignedMentor: mentors[1]._id
      },
      {
        name: "Alex Kumar",
        email: "alex@student.com",
        password: hashedPassword,
        role: "student",
        onboardingCompleted: true,
        learningProfile: {
          skillTrack: "Data Science",
          experienceLevel: "Beginner",
          commitmentTime: "20h/week",
          learningStyle: "Reading",
          learningGoal: "Career Change"
        },
        assignedMentor: mentors[2]._id
      }
    ]);
    console.log(`✅ Created ${students.length} students`);

    // Update mentor student counts
    await User.findByIdAndUpdate(mentors[0]._id, { studentCount: 1 });
    await User.findByIdAndUpdate(mentors[1]._id, { studentCount: 1 });
    await User.findByIdAndUpdate(mentors[2]._id, { studentCount: 1 });

    // Create Courses
    console.log("📚 Creating courses...");
    const courses = await Course.insertMany([
      {
        title: "Full-Stack Web Development Bootcamp",
        description: "Master modern web development with React, Node.js, and MongoDB. Build real-world applications from scratch.",
        category: "Web Development",
        createdBy: admin._id,
        instructor: mentors[0]._id
      },
      {
        title: "UI/UX Design Masterclass",
        description: "Learn user interface and user experience design principles. Create stunning, user-friendly designs.",
        category: "Design",
        createdBy: admin._id,
        instructor: mentors[1]._id
      },
      {
        title: "Data Science with Python",
        description: "Dive into data analysis, machine learning, and visualization with Python and popular libraries.",
        category: "Data Science",
        createdBy: admin._id,
        instructor: mentors[2]._id
      }
    ]);
    console.log(`✅ Created ${courses.length} courses`);

    // Update student course enrollments
    await User.findByIdAndUpdate(students[0]._id, {
      "learningProfile.course": { id: courses[0]._id, title: courses[0].title }
    });
    await User.findByIdAndUpdate(students[1]._id, {
      "learningProfile.course": { id: courses[1]._id, title: courses[1].title }
    });
    await User.findByIdAndUpdate(students[2]._id, {
      "learningProfile.course": { id: courses[2]._id, title: courses[2].title }
    });

    // Create Levels for each course
    console.log("📊 Creating levels...");
    const levelNames = ["Awareness", "Beginner", "Fundamental", "Intermediate", "Advanced", "Proficient", "Mastery"];
    const allLevels = [];

    for (const course of courses) {
      for (let i = 0; i < levelNames.length; i++) {
        const level = await Level.create({
          title: levelNames[i],
          order: i + 1,
          course: course._id
        });
        allLevels.push(level);
      }
    }
    console.log(`✅ Created ${allLevels.length} levels`);

    // Create Lessons for first course (Full-Stack)
    console.log("📝 Creating lessons...");
    const course1Levels = allLevels.filter(l => l.course.toString() === courses[0]._id.toString());
    
    const lessons = await Lesson.insertMany([
      {
        title: "Introduction to Web Development",
        description: "Learn the basics of web development and what you'll build in this course",
        content: "Welcome to Full-Stack Web Development! In this lesson, we'll cover the fundamentals...",
        course: courses[0]._id,
        level: course1Levels[0]._id,
        order: 1,
        createdBy: mentors[0]._id
      },
      {
        title: "HTML Fundamentals",
        description: "Master HTML structure and semantic elements",
        content: "HTML is the backbone of every website. Let's learn how to structure content...",
        course: courses[0]._id,
        level: course1Levels[1]._id,
        order: 1,
        videoUrl: "https://www.youtube.com/watch?v=example",
        createdBy: mentors[0]._id
      },
      {
        title: "CSS Styling Basics",
        description: "Style your web pages with CSS",
        content: "CSS brings your HTML to life with colors, layouts, and animations...",
        course: courses[0]._id,
        level: course1Levels[1]._id,
        order: 2,
        createdBy: mentors[0]._id
      },
      {
        title: "JavaScript Essentials",
        description: "Learn programming with JavaScript",
        content: "JavaScript adds interactivity to your websites. Let's start coding...",
        course: courses[0]._id,
        level: course1Levels[2]._id,
        order: 1,
        createdBy: mentors[0]._id
      }
    ]);
    console.log(`✅ Created ${lessons.length} lessons`);

    // Create Quiz for one lesson
    console.log("❓ Creating quizzes...");
    const quiz = await Quiz.create({
      lesson: lessons[1]._id,
      questions: [
        {
          question: "What does HTML stand for?",
          options: [
            "Hyper Text Markup Language",
            "High Tech Modern Language",
            "Home Tool Markup Language",
            "Hyperlinks and Text Markup Language"
          ],
          correctAnswer: 0
        },
        {
          question: "Which HTML tag is used for the largest heading?",
          options: ["<heading>", "<h6>", "<h1>", "<head>"],
          correctAnswer: 2
        },
        {
          question: "What is the correct HTML element for inserting a line break?",
          options: ["<break>", "<lb>", "<br>", "<newline>"],
          correctAnswer: 2
        }
      ]
    });
    console.log("✅ Created quiz");

    // Create Progress for students
    console.log("📈 Creating progress records...");
    const progress1 = await Progress.create({
      user: students[0]._id,
      course: courses[0]._id,
      levelsProgress: [
        {
          level: course1Levels[0]._id,
          completedLessons: [lessons[0]._id],
          score: 100,
          isCompleted: true
        },
        {
          level: course1Levels[1]._id,
          completedLessons: [lessons[1]._id],
          score: 85,
          isCompleted: false
        }
      ],
      xpEarned: 25
    });
    console.log("✅ Created progress records");

    // Create Sessions
    console.log("📅 Creating sessions...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    await Session.insertMany([
      {
        studentId: students[0]._id,
        mentorId: mentors[0]._id,
        date: tomorrow,
        status: "scheduled",
        meetingLink: "https://meet.jit.si/pathmentor-session-1"
      },
      {
        studentId: students[1]._id,
        mentorId: mentors[1]._id,
        date: nextWeek,
        status: "scheduled",
        meetingLink: "https://meet.jit.si/pathmentor-session-2"
      }
    ]);
    console.log("✅ Created sessions");

    // Create Projects
    console.log("📁 Creating projects...");
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await Project.create({
      title: "Build a Personal Portfolio Website",
      description: "Create a responsive portfolio website showcasing your skills and projects",
      instructions: "Use HTML, CSS, and JavaScript to build a multi-page portfolio. Include: Home, About, Projects, and Contact pages. Make it responsive and deploy it online.",
      dueDate,
      mentor: mentors[0]._id,
      assignedTo: [students[0]._id],
      course: courses[0]._id,
      status: "active"
    });
    console.log("✅ Created projects");

    // Create Announcements
    console.log("📢 Creating announcements...");
    await Announcement.insertMany([
      {
        title: "Welcome to PathMentor!",
        message: "We're excited to have you join our learning community. Start your journey today!",
        createdBy: admin._id,
        role: "admin",
        category: "General"
      },
      {
        title: "New Course: Data Science with Python",
        message: "Check out our latest course on Data Science. Perfect for beginners and intermediate learners.",
        createdBy: admin._id,
        role: "admin",
        category: "News"
      }
    ]);
    console.log("✅ Created announcements");

    console.log("\n🎉 Seeding completed successfully!");
    console.log("\n📋 Test Accounts:");
    console.log("━".repeat(50));
    console.log("Admin:");
    console.log("  Email: admin@pathmentor.com");
    console.log("  Password: Test@123");
    console.log("\nMentors:");
    console.log("  Email: sarah@pathmentor.com (Full-Stack)");
    console.log("  Email: michael@pathmentor.com (UI/UX)");
    console.log("  Email: emily@pathmentor.com (Data Science)");
    console.log("  Password: Test@123");
    console.log("\nStudents:");
    console.log("  Email: john@student.com (Full-Stack)");
    console.log("  Email: jane@student.com (UI/UX)");
    console.log("  Email: alex@student.com (Data Science)");
    console.log("  Password: Test@123");
    console.log("━".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
