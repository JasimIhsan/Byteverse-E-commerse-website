const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobileNumber: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    googleId: {
        type: String,
        // unique: true,
    },
    joinedDate: {
        type: Date,
        default: Date.now,
    },
    orders: {
        type: Number,
        default: 0,
    },
    walletBalance: {
        type: Number,
        default: 0.0,
    },
    status: {
        type: String,
        enum: ["Unblocked", "Blocked"],
        default: "Unblocked",
    },
    defaultAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        default: null,
    },
    usedCoupons: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
        },
    ],
    isFirstLogin: {
        type: Boolean,
        default: true,
    },
});

module.exports = mongoose.model("User", userSchema);
