const express=require('express')
const router=express.Router()
const User=require('../models/User')
const bcrypt=require('bcrypt')
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const Post=require('../models/Post')
const Comment=require('../models/Comment')
const verifyToken = require('../verifyToken')
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');
const upload = require("../middleware/upload");


dotenv.config();



//CREATE 
//e.g: 
/*{
  "title": "demo1",
  "desc": "description1",
  "photo": "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "username": "prit",
  "userId": "651f122bb7b6d4abbd48c130",
  "categories": ["demo1","demo2"]
}*/


router.post("/create",verifyToken,async (req,res)=>{
    try {
        // console.log(req.body);
        
        // console.log(req.user);

        
        const newPost = new Post({
            title: req.body.title,
            desc: req.body.desc,
            // photo: req.file ? req.file.filename : null, // Store the filename of the uploaded image
            photo: req.body.photo,
            username: req.user.username,
            userId: req.user.id,
            categories: req.body.categories
        });

        const savedPost = await newPost.save();
        res.status(200).json(savedPost);
    } catch (err) {
        res.status(500).json(err);
    }
     
})

//UPDATE    e.g http://localhost:5000/api/posts/652043c623a9545e6ba4b818
/*{
  "title": "demo1",
  "desc": "description1",
  "photo": "https://images.pexels.com/photos/3573351/pexels-photo-3573351.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  "username": "prit33",
  "userId": "651f122bb7b6d4abbd48c130",
  "categories": ["demo1","demo2"]
} */
router.put("/:id",verifyToken,async (req,res)=>{
    try{
       
        const updatedPost=await Post.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true})
        // console.log(updatedPost)
        res.status(200).json(updatedPost)

    }
    catch(err){
        res.status(500).json(err)
    }
})


//DELETE    e.g http://localhost:5000/api/posts/651fd1d207e43d277eaaa271
router.delete("/:id",verifyToken,async (req,res)=>{
    try{
        await Post.findByIdAndDelete(req.params.id)
        await Comment.deleteMany({postId:req.params.id})
        res.status(200).json("Post has been deleted!")

    }
    catch(err){
        res.status(500).json(err)
    }
})


//GET POST DETAILS e.g:http://localhost:5000/api/posts/67b48ea4723a6d3efcc8497a
router.get("/:id",async (req,res)=>{
    try{
        const post=await Post.findById(req.params.id)
        res.status(200).json(post)
    }
    catch(err){
        res.status(500).json(err)
    }
})

//GET POSTS e.g http://localhost:5000/api/posts/652043c623a9545e6ba4b818
router.get("/",async (req,res)=>{
    const query=req.query
    // console.log(query);
    try{
        const searchFilter={
            title:{$regex:query.search, $options:"i"}
        }
        const posts=await Post.find(query.search?searchFilter:null)
        // const posts=await Post.find();
        res.status(200).json(posts)
    }
    catch(err){
        res.status(500).json(err)
    }
})

//GET USER POSTS  e.g http://localhost:5000/api/posts/user/651f122bb7b6d4abbd48c130 (endpoint is userId not postId)
router.get("/user/:userId",async (req,res)=>{
    // try{
    //     const posts=await Post.find({userId:req.params.userId})
    //     res.status(200).json(posts)
    // }
    // catch(err){
    //     res.status(500).json(err)
    // }
    try {
        const posts = await Post.find({ userId: req.params.userId });
        // console.log(posts)
        // const postsWithImages = posts.map(post => {
        //     if (post.photo) {
        //         post.photo = `http://localhost:5000/api/posts/image/${post.photo}`;
        //     }
        //     return post;
        // });
        // console.log(posts);
        // res.status(200).json(postsWithImages);
        res.status(200).json(posts);        // changed- now postswithImages is not needed
    } catch (err) {
        res.status(500).json(err);
    }
})

// Serve image by filename (17-02-2025)
// router.get('/image/:filename', async (req, res) => {
//     try {
//         const file = await gfs.find({ filename: req.params.filename }).toArray();
//         if (!file || file.length === 0) {
//             return res.status(404).json({ message: "File not found" });
//         }

//         gfs.openDownloadStreamByName(req.params.filename).pipe(res);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

router.get("/image/:filename", async (req, res) => {
    try {
        if (!gfs) {
            return res.status(500).json({ message: "GridFS is not initialized" });
        }

        // Find file in GridFS
        const file = await gfs.files.findOne({ filename: req.params.filename });

        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }

        // Ensure the file is an image
        if (!file.contentType.startsWith("image/")) {
            return res.status(400).json({ message: "Not an image file" });
        }

        // Create a read stream and send the image
        const readStream = gfs.createReadStream(file.filename);
        res.set("Content-Type", file.contentType);
        readStream.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving image" });
    }
});


// toggle status i.e open of the post
router.put("/:id/toggle-status", verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.userId !== req.user.id) {
            return res.status(403).json({ message: "You can only update your post" });
        }

        post.open = !post.open; // Toggle open status
        await post.save();

        res.status(200).json({ message: "Post status updated", open: post.open });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports=router