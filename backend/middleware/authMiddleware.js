const jwt = require("jsonwebtoken");
const User = require("../models/User");

// create middleware function
const guard = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User account no longer exists or has been deactivated"
                });
            }

            next();

        } catch (error) {
            console.error("Token verification failed:", error.message);
            
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please log in again."
                });
            }

            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in."
        });
    }
}

// role-based access 
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    }
}

module.exports = { guard, authorize };