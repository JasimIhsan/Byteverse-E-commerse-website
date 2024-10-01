// Set up multer for file uploads
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "./uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append the timestamp to the file name
    },
});

const upload = multer({ storage: storage });

module.exports = upload;
