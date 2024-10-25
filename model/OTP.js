const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures a single OTP document per email
        lowercase: true, // Normalize email to lowercase
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now, // Set default to the current date
    },
    verified: {
        type: Boolean,
        default: false,
    },
    resetToken: { // Optional: Add a field for storing the reset token
        type: String,
        default: null,
    },
    tokenExpiration: { // Optional: Add a field for storing token expiration time
        type: Date,
        default: null,
    },
});

// Create an index for better performance on the email field
otpSchema.index({ email: 1 });

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
