// const jwt=require('jsonwebtoken')

// const verifyToken=(req,res,next)=>{
//     console.log(req.cookies)
//     const token=req.cookies.token
//     console.log(req.headers.authorization)
//     if(!token){
//         return res.status(401).json("You are not authenticated!")
//     }
//     jwt.verify(token,process.env.SECRET,async (err,data)=>{
//         if(err){
//             return res.status(403).json("Token is not valid!")
//         }
//         // console.log(data);
//         req.userId=data._id
//         // console.log(req.usedId);
       
//         // console.log("passed")
        
//         next()
//     })
// }

// module.exports=verifyToken
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json("You are not authenticated!");
    }

    const token = authHeader; // If you're not using "Bearer <token>", no need to split

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json("Token is not valid!");
        }

        req.user = { id: decoded._id, username: decoded.username }; // Attach user details

        next();
    });
};

module.exports = verifyToken;
