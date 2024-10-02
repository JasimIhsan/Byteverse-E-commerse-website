const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "./uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Store files in the uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate unique filenames
    },
});

const upload = multer({ storage: storage });

// Use fields to allow for separate inputs but still treat all as a single array
const productImageUpload = upload.fields([
    { name: "images", maxCount: 10 }, // Allow multiple files (minimum 3)
]);

module.exports = productImageUpload;
