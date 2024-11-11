// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://Jasim_Ihsan:JasimIhsan9656@byteverse.jymgd.mongodb.net/Byteverse_E-commerse?retryWrites=true&w=majority&appName=Byteverse_E-commerse", {
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
