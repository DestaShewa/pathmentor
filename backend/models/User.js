const mongoose=require("mongoose");

const userSchema=new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        }, 
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            minlength: 8
        },
        role: {
            type: String,
            enum: ["student", "mentor", "admin"], 
            
        },
        avatarUrl: {
            type: String,
            default: null
        },
        
        verificationToken: {
            type: String
        },
        learningProfile: {
            skillTrack: String,
            experienceLevel: String,
            commitmentTime: String,
            learningStyle: String,
            learningGoal: String,
            personalGoal: String,
            persona: String,
            emoji: String,
            tagline: String,
            description: String,
            traits: [String],
            aiSummary: String,
            superpower: String,
            kryptonite: String,
            dayOneActionPlan: String,
            confidenceScore: Number,
            roadmap: String,
            startingStage: String,
            lessonLength: String,
            contentPriority: String,
            dailyPlan: String,
            projectRecommendation: String,
            recommendedLessons: [
              {
                title: String,
                time: String,
                matchScore: Number
              }
            ],
            learningPath: [String], // for backward compatibility or future use
            recommendedProjects: mongoose.Schema.Types.Mixed, // Can be old array of strings or new array of objects
            strengths: [String],
            recommendation: String,
            course: {
              id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course"
              },
              title: String
            },
            courseLevel: String
      },
     onboardingCompleted: {
             type: Boolean,
            default: false
     },
     // Assigned mentor (for students)
     assignedMentor: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User",
       default: null
     },
     // Cached student count (for mentors — updated on assignment)
     studentCount: {
       type: Number,
       default: 0
     },
     // streak tracking
     streak: {
       current: { type: Number, default: 0 },
       longest: { type: Number, default: 0 },
       lastStudiedAt: { type: Date, default: null }
     },
     // mentor verification
     mentorVerification: {
             status: {
              type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
             },
             documents: { type: [String], default: [] },
             reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
             },
             reviewedAt: Date
     },
     
     // Online status for real-time chat
     isOnline: {
       type: Boolean,
       default: false
     },
     lastSeen: {
       type: Date,
       default: Date.now
     }


        
    }, 
    { timestamps: true}
); 

module.exports = mongoose.model("User", userSchema);