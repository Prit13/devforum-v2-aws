const express=require('express')
const router=express.Router()
const User=require('../models/User')
const bcrypt=require('bcrypt')
const Post=require('../models/Post')
const Comment=require('../models/Comment')
const verifyToken = require('../verifyToken')


//UPDATE USER     http://localhost:5000/api/users/651fc2d445450fe6ce5d3cf3 i.e _id
//              need username,password,email in body 
router.put("/:id", verifyToken, async (req, res) => {
    try {
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hashSync(req.body.password, salt);
        }

        // Find the user before updating
        const existingUser = await User.findById(req.params.id);
        // console.log(existingUser);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if username is being updated
        const isUsernameUpdated = req.body.username && req.body.username !== existingUser.username;

        // Update the User schema
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        // If username was updated, also update all posts with the new username
        if (isUsernameUpdated) {
            const updatePosts = await Post.updateMany(
                { userId: req.params.id },  // Match posts by userId instead of username
                { $set: { username: req.body.username } } // Update the username in posts
            );
            // console.log(`Updated ${updatePosts.modifiedCount} posts.`);
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});




//DELETE                 need _id in endpoint of route
router.delete("/:id",verifyToken,async (req,res)=>{
    try{
        
        const user = await User.findById(req.params.id);
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        
        if (!isMatch) return res.status(400).json("Incorrect password!");

        await User.findByIdAndDelete(req.params.id)
        await Post.deleteMany({userId:req.params.id})
        await Comment.deleteMany({userId:req.params.id})
        res.status(200).json("User has been deleted!")

    }
    catch(err){
        res.status(500).json(err)
    }
})


//GET USER
router.get("/:id",async (req,res)=>{
    try{
        const user=await User.findById(req.params.id)
        const {password,...info}=user._doc
        res.status(200).json(info)
    }
    catch(err){
        res.status(500).json(err)
    }
})


module.exports=router