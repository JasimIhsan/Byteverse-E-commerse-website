const express = require("express");
const router = express.Router();
const home = require("../../Controller/user/user");
const auth = require("../../middleware/userAuth");
const passport = require("../../config/passportSetup");
const shop = require("../../Controller/user/shop");
const profile = require("../../Controller/user/profile");
const checkout = require("../../Controller/user/checkout");

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
// ----------------------------- shope ----------------------------------------------//

router.get("/shop", shop.getShop);

router.get("/shop/product-detail/:productId", shop.getProductDetail);

//------------------------------ User profile page -----------------------------------//

router.get("/:userId/profile", profile.getProfile);

//---- order -----//

router.get("/:userId/profile/orders", profile.getOrders);

router.post("/profile/orders/cancel-order", profile.cancelOrder);

//---- address -----//

router.get("/:userId/profile/address", profile.getAddress);

router.get("/:userId/profile/address/add-address", profile.getAddAddress);

router.post("/:userId/profile/address/add-address", profile.postAddAddress);

router.delete("/:userId/profile/address/:addressId", profile.deleteAddress);

router.get("/:userId/profile/address/:addressId/edit-address", profile.editAddress);

router.post("/:userId/profile/address/:addressId/edit-address", profile.updateAddress);

//------------------------------ Checkout -----------------------------------//

router.get("/:userId/cart", checkout.getCart);

router.post("/:userId/add-to-cart", checkout.postAddtoCart);

router.post("/:userId/cart/update", checkout.updateCart);

router.post("/:userId/cart/:productId/delete-item", checkout.delete_item);

router.get("/:userId/cart/checkout", auth.checkOrderPlaced, checkout.getCheckout);

router.post("/:userId/cart/checkout", auth.checkOrderPlaced, checkout.creatingOrder);

router.get("/:userId/cart/checkout/order-placed/:orderId", checkout.getPlaceOrder);

module.exports = router;
