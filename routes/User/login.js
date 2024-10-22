const express = require("express");
const router = express.Router();
const home = require("../../Controller/user/user");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");
const shop = require("../../Controller/user/shop");
const profile = require("../../Controller/user/profile");
const checkout = require("../../Controller/user/checkout");
const User = require("../../model/user");

//------------------- login and sign up -----------------------//

router.get("/", home.getHome);

router.post("/login", auth.isLogged, home.postHome);

router.get("/login", auth.isLogged, home.getLogin);

router.post("/", auth.isLogged, home.postLogin);

router.get("/login/enter-otp", auth.isLogged, home.getEnterOTP);

router.post("/login/enter-otp", auth.isLogged, home.postSignup);

router.post("/login/enter-otp/verify-otp", auth.isLogged, home.varifyOTP);

router.post("/signup/resend-otp", auth.isLogged, home.resendOTP);

router.post("/logout", home.Logout);

// router.get("/login/enter-email", home.forgotPasswordEmailEnter);

// router.post("/login/enter-email", home.postForgotPasswordEmailEnter);

// router.get("/login/enter-email/otp-enter", home.forgotOtp);

// router.post("/login/enter-email/otp-enter", home.verifyForgotPasswordOTP);

// router.get("/login/enter-email/otp-enter/new-password", home.getNewPassword);

// router.get(
//     "/auth/google",
//     auth.isLogged,
//     passport.authenticate("google", {
//         scope: ["profile", "email"],
//     })
// );

// router.get("/auth/google/callback", auth.isLogged, (req, res, next) => {
//     passport.authenticate("google", (err, user, info) => {
//         if (err) {
//             return next(err);
//         }
//         if (!user) {
//             return res.redirect(`/login?error=${encodeURIComponent(info.message)}`);
//         }
//         req.logIn(user, (err) => {
//             if (err) {
//                 return next(err);
//             }
//             return res.redirect("/");
//         });
//     })(req, res, next);
// });

// Google Authentication Routes

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
            return res.redirect(`/login?error=${encodeURIComponent(info?.message || "Authentication failed")}`);
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            req.session.user = true;
            req.session.userId = user._id;

            return res.redirect("/");
        });
    })(req, res, next);
});

// ----------------------------- shope ----------------------------------------------//

router.get("/shop", shop.getShop);

router.get("/shop/product-detail/:productId", shop.getProductDetail);

// router.post('/shop/filter', shop.shopFilter)

//------------------------------ User profile page -----------------------------------//

router.get("/:userId/profile", auth.checkSession, profile.getProfile);

router.post("/profile/update-profile", profile.updateProfile);

router.post("/profile/update-password", profile.changePassword);

//---- order -----//

router.get("/:userId/profile/orders", auth.checkSession, profile.getOrders);

router.post("/profile/orders/cancel-order", auth.checkSession, profile.cancelOrder);

router.get('/profile/orders/orderdetail/:orderId', profile.getOrderDetails)

//---- address -----//

router.get("/:userId/profile/address", auth.checkSession, profile.getAddress);

router.get("/:userId/profile/address/add-address", auth.checkSession, profile.getAddAddress);

router.post("/:userId/profile/address/add-address", auth.checkSession, profile.postAddAddress);

router.delete("/:userId/profile/address/:addressId", auth.checkSession, profile.deleteAddress);

router.get("/:userId/profile/address/:addressId/edit-address", auth.checkSession, profile.editAddress);

router.post("/:userId/profile/address/:addressId/edit-address", auth.checkSession, profile.updateAddress);

//----- wishlist -----//

router.get("/profile/wishlist", profile.getWishlist);

router.post("/profile/wishlist/add", profile.addToWishlist);

router.post("/wishlist/remove", profile.removeFromWishlist);

//------------------------------ Checkout -----------------------------------//

router.get("/cart", checkout.getCart);

router.post("/:userId/add-to-cart", checkout.postAddtoCart);

router.post("/cart/update", checkout.updateCart);

router.post("/cart/:productId/delete-item", checkout.delete_item);

router.get("/:userId/cart/checkout", auth.checkSession, auth.checkOrderPlaced, checkout.getCheckout);

router.post("/apply-coupon", checkout.applyCoupon);

router.post("/:userId/cart/checkout", auth.checkSession, auth.checkOrderPlaced, checkout.creatingOrder);

router.get("/:userId/cart/checkout/order-placed/:orderId", auth.checkSession, checkout.getPlaceOrder);

//------------------------------ Wishlist -----------------------------------//

module.exports = router;
