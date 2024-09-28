const express = require("express");
const router = express.Router();
const user = require("../../Controller/userController");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");

//==== get home page ====//
router.get("/", user.getHome);

//==== Home to login ====//
router.post("/login", user.postHome);

//==== get login page ====//
router.get("/login", user.getLogin);

//==== login (success) to home ====//
router.post("/", user.postLogin);

//===== get OTP entering page ======//
router.get("/login/enter-otp", user.getEnterOTP);

//==== post sign up to otp entering page =====//
router.post("/login/enter-otp", user.postSignup);

//==== OTP varifcaiton ====//
router.post("/login/enter-otp/verify-otp", user.varifyOTP);

//===== resend otp =====//
router.post("/signup/resend-otp", user.resendOTP);

router.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    user.handleGoogleAuth
);

module.exports = router;
