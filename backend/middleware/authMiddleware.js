const jwt=require("jsonwebtoken");
const User=require("../models/User");

// create middleware function
const guard= async(req, res, next)=>{
    let token;

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        try{
            token = req.headers.authorization.split(" ")[1];
           // verify token
            const decoded=jwt.verify(token, process.env.JWT_SECRET);

            // GET USER FROM DATABASE 
            req.user= await User.findById(decoded.id).select("-password");

            next();

        } catch(error){
            console.error("Token verification failed ", error );
            return res.status(401).json({
                message: "Unauthoriized token"
            });
        }
    }
    
    if(!token){
        return res.status(401).json({
            message: "no token" 
        });
    };
}

// role-based access 
const authorize= (...roles)=>{
    return (req, res, next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                message: "Access denied"
            });
        }
        next();
    }
}

module.exports ={ guard, authorize };