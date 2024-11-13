const express = require("express");
const router = express.Router();
const home = require("../../Controller/user/user");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");
const shop = require("../../Controller/user/shop");
const profile = require("../../Controller/user/profile");
const checkout = require("../../Controller/user/checkout");
const User = require("../../model/user");
const razorpay = require("../../config/razorpay");

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

router.get("/login/enter-email", auth.isLogged, home.forgotPasswordEmailEnter);

router.post("/login/enter-email", auth.isLogged, home.postForgotPasswordEmailEnter);

router.get("/login/enter-email/otp-enter", auth.isLogged, home.forgotOtp);

router.post("/login/enter-email/otp-enter", auth.isLogged, home.verifyForgotPasswordOTP);

router.get("/login/enter-email/otp-enter/new-password", auth.isLogged, home.getNewPassword);

router.post("/login/enter-email/otp-enter/new-password", auth.isLogged, home.postNewPassword);

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

router.get('/about', home.about);

router.get('/help-contact', home.getHelpAndContact);


// ----------------------------- shope ----------------------------------------------//

router.get("/shop", shop.getShop);

router.get("/shop/product-detail/:productId", shop.getProductDetail);

// router.post('/shop/filter', shop.shopFilter)

//------------------------------ User profile page ----------------------------------//

router.get("/:userId/profile", auth.checkSession, profile.getProfile);

router.post("/profile/update-profile", auth.checkSession, profile.updateProfile);

router.post("/profile/update-password", auth.checkSession, profile.changePassword);

//---- order -----//

router.get("/:userId/profile/orders", auth.checkSession, profile.getOrders);

router.post("/profile/orders/cancel-order", auth.checkSession, profile.cancelOrder);

router.post("/profile/orders/return-order", auth.checkSession, profile.returnOrder);

router.get("/profile/orders/orderdetail/:orderId", auth.checkSession, profile.getOrderDetails);

router.get("/profile/orders/orderdetail/:orderId/invoice", auth.checkSession, profile.downloadInvoice);

//---- address -----//

router.get("/:userId/profile/address", auth.checkSession, profile.getAddress);

router.get("/:userId/profile/address/add-address", auth.checkSession, profile.getAddAddress);

router.post("/:userId/profile/address/add-address", auth.checkSession, profile.postAddAddress);

router.delete("/:userId/profile/address/:addressId", auth.checkSession, profile.deleteAddress);

router.get("/:userId/profile/address/:addressId/edit-address", auth.checkSession, profile.editAddress);

router.post("/:userId/profile/address/:addressId/edit-address", auth.checkSession, profile.updateAddress);

//----- wishlist -----//

router.get("/profile/wishlist", auth.checkSession, profile.getWishlist);

router.post("/profile/wishlist/add", auth.checkSession, profile.addToWishlist);

router.post("/wishlist/remove", auth.checkSession, profile.removeFromWishlist);

//----- wallet ------//

router.get("/profile/wallet", auth.checkSession, profile.getWallet);

router.post("/profile/wallet/add-money", auth.checkSession, razorpay.walletAddMoney);

router.post("/profile/wallet/add-money/varify", auth.checkSession, razorpay.walletVerifyPayment);

//------------------------------ Checkout -----------------------------------//

// ------------ cart ---------------- //

router.get("/cart", auth.checkSession, checkout.getCart);

router.post("/:userId/add-to-cart", auth.checkSession, checkout.postAddtoCart);

router.post("/cart/update", auth.checkSession, checkout.updateCart);

router.post("/cart/:productId/delete-item", auth.checkSession, checkout.delete_item);

// ----------- checkout ----------- //

router.get("/:userId/cart/checkout", auth.checkSession, auth.checkOrderPlaced, checkout.getCheckout);

router.post("/apply-coupon", auth.checkSession, auth.checkOrderPlaced, checkout.applyCoupon);

router.post("/remove-coupon", auth.checkSession, auth.checkOrderPlaced, checkout.removeCoupon);

router.post("/cart/checkout/cod", auth.checkSession, auth.checkOrderPlaced, checkout.creatingOrder);

router.post("/cart/checkout/wallet", auth.checkSession, auth.checkOrderPlaced, checkout.creatingOrder);

// ------------ get order placed --------- //

router.get("/cart/checkout/order-placed/:orderId", auth.checkSession, checkout.getPlaceOrder);

//------------------------------ Razor pay -----------------------------------//

router.post("/cart/checkout/upi", auth.checkSession, razorpay.createOrder);

router.post("/cart/checkout/upi/verify-payment", auth.checkSession, razorpay.verifyPayment);

router.post("/cart/checkout/upi/order-failure", auth.checkSession, razorpay.paymentFailure);

router.post("/cart/checkout/upi/retry-payment/:orderId", auth.checkSession, razorpay.retryPayment);

module.exports = router;
