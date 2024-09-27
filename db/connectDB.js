const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb://localhost:27017/Byteverse_E-commerse");
        console.log(`MongoDB Connected : mongodb://localhost:27017/Byteverse_E-commerse`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;
