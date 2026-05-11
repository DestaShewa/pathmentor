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
     }


        
    }, 
    { timestamps: true}
); 

module.exports = mongoose.model("User", userSchema);