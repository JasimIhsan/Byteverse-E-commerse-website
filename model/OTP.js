const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    resetToken: { 
        type: String,
        default: null,
    },
    tokenExpiration: { 
        type: Date,
        default: null,
    },
});

otpSchema.index({ email: 1 });

const OTP = mongoose.model("OTP", otpSchema);

module.exports = OTP;
