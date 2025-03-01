const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Grid = require("gridfs-stream");
const cookieParser = require('cookie-parser');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const postRoute = require('./routes/posts');
const commentRoute = require('./routes/comments');
const upload = require("./routes/upload");


dotenv.config();

const app = express();

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database is connected successfully!");
    } catch (err) {
        console.error(err);
    }
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "https://devforum-v2.vercel.app",
    credentials: true
}));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://devforum-v2.vercel.app");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers");
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Private-Network", true);
    res.setHeader("Access-Control-Max-Age", 7200);
    next();
});

let gfs;
const conn = mongoose.connection;

conn.once("open", function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection("photos");
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/comments", commentRoute);

app.use("/api/file", upload)




app.get("/file/:filename", async (req, res) => {
    try {
        
        const file = await gfs.files.findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ message: "File not found" });
        }
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        console.log(error);
        res.send("error: " + error.message);
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connectDB();
    console.log(`App is running on port ${PORT}`);
});