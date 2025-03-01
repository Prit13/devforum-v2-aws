const express=require('express')
const router=express.Router()
const User=require('../models/User')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')


//REGISTER- need username, email, password (pass in body as json)
/*eg. 
{
  "username": "Prit",
  "email": "prit@gmail.com",
  "password": "123"
} */
router.post("/register",async(req,res)=>{
    try{
        const {username,email,password}=req.body
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hashSync(password,salt)
        const newUser=new User({username,email,password:hashedPassword})
        const savedUser=await newUser.save()
        // console.log(savedUser);
        res.status(200).json(savedUser)

    }
    catch(err){
        res.status(500).json(err)
    }

})


//LOGIN         need email and password 
router.post("/login",async (req,res)=>{
    try{
        const user=await User.findOne({email:req.body.email})   // search user with that email id
        // console.log(user)
        if(!user){
            return res.status(404).json("User not found!")
        }
        const match=await bcrypt.compare(req.body.password,user.password)
        
        if(!match){
            return res.status(401).json("Wrong credentials!")
        }

        // if the user found with that email and password, generate jwt token  
        //  payload: id, username, email, secretkey, expiration (optional)
        const token=jwt.sign({_id:user._id, username:user.username,email:user.email},process.env.SECRET,{expiresIn:"3d"})    // for 3 days, jwt token will be there
        const {password,...info}=user._doc      // separating password and other info (storing all info in "info" except password)
        // _doc is an internal property that stores the raw MongoDB dat        
        
        // Set token as HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true, // Prevents client-side access (security)
            secure: true,   // Required for HTTPS (Render forces HTTPS)
            sameSite: "none", // Needed for cross-site requests
        });

        res.status(200).json({info,token: token})            // this is token (jwt)
        // res.json({token,userId: user._id})
        // res.status(200).json(user);

    }
    catch(err){
        res.status(500).json(err)
    }
})



//LOGOUT             nothing require in body
router.get("/logout",async (req,res)=>{
    try{
        res.clearCookie("token",{sameSite:"none",secure:true}).status(200).send("User logged out successfully!")

    }
    catch(err){
        res.status(500).json(err)
    }
})

//REFETCH USER      to avoid automatically logout after refreshing the page
router.get("/refetch", (req,res)=>{
    // const token=req.cookies.token
    // // console.log(req.cookies.token);
    // jwt.verify(token,process.env.SECRET,{},async (err,data)=>{
    //     // console.log("refetch called")
    //     // console.log(data);

    //     if(err){
    //         return res.status(404).json(err)
    //     }
    //     res.status(200).json(data)
    // })
    const token = req.cookies.token;
    // console.log(req.cookies)
    // const token =req.headers.authorization
    if (!token) {
        return res.status(401).json({ message: "No token found" });
    }

    // console.log(token)

    jwt.verify(token, process.env.SECRET, {}, async (err, decodedData) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }

        try {
            const user = await User.findById(decodedData._id).select("-password"); // Exclude password
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.status(200).json({ info: user, token }); // Send both user info & token
        } catch (error) {
            res.status(500).json({ message: "Server error" });
        }
    });
})



module.exports=router