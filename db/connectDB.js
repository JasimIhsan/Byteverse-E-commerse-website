// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected    : ✅`);
        console.log("==========================");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); 
    }
};

module.exports = connectDB;
