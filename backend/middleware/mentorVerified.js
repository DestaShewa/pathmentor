const { off } = require("../models/User")

// block unverified mentor
const mentorVerified = (req, res, next) => {
    if(req.user.role === "mentor"){
        if(req.user.mentorVerification.status !== "approved") {
            return res.status(403).json({
                message: "Mentor not verified yet"
            });
        }
    }
    next();
};

module.exports = mentorVerified;