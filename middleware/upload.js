const multer = require("multer");
const {GridFsStorage} = require("multer-gridfs-storage");
const mongoose = require("mongoose");
const dotenv = require('dotenv');

dotenv.config();

// const promise = mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
const storage = new GridFsStorage({
    url: process.env.MONGO_URL,
    // db: promise,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const match = ["image/png", "image/jpeg"];

        if (match.indexOf(file.mimetype) === -1) {
            const filename = `${Date.now()}-${file.originalname}`;
            return filename;
        }

        return {
            bucketName: "photos",
            filename: `${Date.now()}-${file.originalname}`,
        };
    },
});

module.exports = multer({ storage });
