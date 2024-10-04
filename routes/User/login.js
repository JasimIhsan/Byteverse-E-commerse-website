const express = require("express");
const router = express.Router();
const user = require("../../Controller/user/userController");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");

//------------------- login and sign up -----------------------//

router.get("/", user.getHome);

router.post("/login", user.postHome);

router.get("/login", user.getLogin);

router.post("/", user.postLogin);

router.get("/login/enter-otp", user.getEnterOTP);

router.post("/login/enter-otp", user.postSignup);

router.post("/login/enter-otp/verify-otp", user.varifyOTP);

router.post("/signup/resend-otp", user.resendOTP);

router.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        failureRedirect: "/login",
    })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    user.handleGoogleAuth
);

//------------------------------ Product detail page -----------------------------------//

router.get("/product-detail/:productId", user.getProductDetail);

router.post("/logout", user.Logout);

module.exports = router;
