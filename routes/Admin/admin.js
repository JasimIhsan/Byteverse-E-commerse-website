const express = require("express");
const router = express.Router();

const dash = require("../../Controller/admin/dashboard");
const user_man = require("../../Controller/admin/user");
const cat_man = require("../../Controller/admin/catogory");
const prd_man = require("../../Controller/admin/products");
const order = require("../../Controller/admin/orders");
const coupon = require("../../Controller/admin/coupon");
const offer = require("../../Controller/admin/offers");

const productImageUpload = require("../../config/multer");
const auth = require("../../middleware/adminAuth");
const { log } = require("debug/src/browser");

//----------- dashboard -----------------//

router.get("/", auth.isLogged, dash.getAdminLogin);

router.get("/dashboard", auth.checkSession, dash.getAdminDashboard);

router.post("/dashboard", auth.isLogged, dash.postAdminLogin);

router.get("/dashboard/download-report", auth.checkSession, dash.downloadReport);

router.post("/dashboard/logout", auth.checkSession, dash.logout);

//----------- User management -----------------//

router.get("/user-management", auth.checkSession, user_man.getUserManagement);

router.patch("/user-management/update-status/:id", auth.checkSession, user_man.updateUserStatus);

router.get("/user-management/user-details/:userId", auth.checkSession, user_man.getUserDetails);

//----------- Catogery management -----------------//

router.get("/category-management", auth.checkSession, cat_man.getCategory);

router.post("/category-management/edit-category", auth.checkSession, cat_man.editCategory);

router.post("/category-management/add-category", auth.checkSession, cat_man.addCategory);

router.patch("/category-management/update-status/:id", auth.checkSession, cat_man.editCategoryStatus);

//----------- Product management -----------------//

router.get("/product-management", auth.checkSession, prd_man.getProduts);

router.get("/product-management/product-detail/:productId", auth.checkSession, prd_man.getProductDetail);

router.patch("/product-management/update-status/:id", auth.checkSession, prd_man.updateProductStatus);

router.get("/product-management/add-product", auth.checkSession, prd_man.getAddProduct);

router.post("/product-management/add-product", auth.checkSession, productImageUpload.array("croppedImage[]", 10), prd_man.postAddProduct);

router.get("/product-management/edit-product/:id", auth.checkSession, prd_man.getEditProduct);

router.post("/product-management/edit-product/:id", auth.checkSession, productImageUpload.array("croppedImage[]", 10), prd_man.postEditProduct);

//----------- Order management -----------------//

router.get("/order-management", auth.checkSession, order.getOrderManagement);

router.post("/order-management/update-status/:orderId", auth.checkSession, order.updateOrderStatus);

router.get("/order-management/order-detail/:orderId", auth.checkSession, order.getOrderDetail);

//----------- Coupon management -----------------//

router.get("/coupon-management", auth.checkSession, coupon.getCoupon);

router.post("/coupon-management/add-coupon", auth.checkSession, coupon.addCoupon);

router.delete("/coupon-management/delete/:couponId", auth.checkSession, coupon.deleteCopon);

router.get("/coupon-management/:couponId", auth.checkSession, coupon.getCouponById);

router.put("/coupon-management/:couponId", auth.checkSession, coupon.updateCoupon);

router.post("/coupons/toggle-status", auth.checkSession, coupon.toggleCouponStatus);

//----------- Offer management -----------------//

router.get("/offer-management", auth.checkSession, offer.getOffer);

router.post("/offer-management/add-offer", auth.checkSession, offer.addOffer);

router.put("/offer-management/update-status/:offerId", auth.checkSession, offer.updateOfferStatus);

router.delete("/offer-management/delete-offer/:offerId", auth.checkSession, offer.deleteOffer);

router.get("/offer-management/:offerId", auth.checkSession, offer.getOfferById);

router.put("/offer-management/edit-offer/:offerId", auth.checkSession, offer.editOffer);

module.exports = router;
