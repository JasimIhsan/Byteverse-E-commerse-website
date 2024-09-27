const express = require("express");
const router = express.Router();
const user = require("../../Controller/userController");

//==== get home page ====//
router.get("/", user.getHome);

//==== Home to login ====//
router.post("/login", user.postHome);

//==== get login page ====//
router.get("/login", user.getLogin);

//===== get OTP verify ======//
router.get("/signup", user.getOTPVerify);

//==== post signup =====//
router.post("/signup", user.postSignup);

//==== OTP varifcaiton ====//
router.post("/signup/verify-otp", user.varifyOTP);

//===== resend otp =====//
router.post("/signup/resend-otp", user.resendOTP);

module.exports = router;
