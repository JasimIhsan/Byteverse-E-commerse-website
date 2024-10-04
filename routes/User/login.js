const express = require("express");
const router = express.Router();
const user = require("../../Controller/user/userController");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");

//------------------- login and sign up -----------------------//

router.get("/", user.getHome);

router.post("/login", auth.isLogged, user.postHome);

router.get("/login", auth.isLogged, user.getLogin);

router.post("/", auth.isLogged, user.postLogin);

router.get("/login/enter-otp", auth.isLogged, user.getEnterOTP);

router.post("/login/enter-otp", auth.isLogged, user.postSignup);

router.post("/login/enter-otp/verify-otp", auth.isLogged, user.varifyOTP);

router.post("/signup/resend-otp", auth.isLogged, user.resendOTP);

router.get(
    "/auth/google",
    auth.isLogged,
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get("/auth/google/callback", auth.isLogged, (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.redirect(`/login?error=${encodeURIComponent(info.message)}`);
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect("/");
        });
    })(req, res, next);
});

//------------------------------ Product detail page -----------------------------------//

router.get("/product-detail/:productId", user.getProductDetail);

router.post("/logout", user.Logout);

module.exports = router;
