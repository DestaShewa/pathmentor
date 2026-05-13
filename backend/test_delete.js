require("dotenv").config();
const mongoose = require("mongoose");
const Session = require("./models/Session");

const MONGODB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pathmentor";

const testDelete = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const sessionId = "6a040ce68a14868f29fccc72"; // The ID from the user's log
        const session = await Session.findById(sessionId);

        if (!session) {
            console.log("Session not found in DB");
            process.exit(0);
        }

        console.log("Current session data:", {
            id: session._id,
            rating: session.studentRating,
            comment: session.studentComment
        });

        // Try setting to null
        try {
            console.log("Attempting to set rating to null...");
            session.studentRating = null;
            session.studentComment = "";
            await session.save();
            console.log("✅ Save successful with null");
        } catch (saveErr) {
            console.error("❌ Save failed with null:", saveErr.message);
            if (saveErr.errors) {
                Object.keys(saveErr.errors).forEach(key => {
                    console.error(`Field ${key} error:`, saveErr.errors[key].message);
                });
            }
        }

        // Try unsetting
        try {
            console.log("\nAttempting to unset rating...");
            await Session.updateOne({ _id: sessionId }, { $unset: { studentRating: 1, studentComment: 1 } });
            console.log("✅ UpdateOne with $unset successful");
        } catch (unsetErr) {
            console.error("❌ UpdateOne with $unset failed:", unsetErr.message);
        }

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

testDelete();
