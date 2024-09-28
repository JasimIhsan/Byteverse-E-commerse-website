const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        unique: true, //unique for users signing with google
    },
    joinedDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);
