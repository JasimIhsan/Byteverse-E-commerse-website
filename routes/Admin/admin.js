const express = require("express");
const router = express.Router();
const dash = require("../../Controller/admin/dashboard");
const user_man = require("../../Controller/admin/user");
const cat_man = require("../../Controller/admin/catogory");
const prd_man = require("../../Controller/admin/products");
const order = require("../../Controller/admin/orders");
const productImageUpload = require("../../config/multer");
const auth = require("../../middleware/adminAuth");
const { log } = require("debug/src/browser");

//----------- dashboard -----------------//

router.get("/", auth.isLogged, dash.getAdminLogin);

router.get("/dashboard", auth.checkSession, dash.getAdminDashboard);

router.post("/dashboard", dash.postAdminLogin);

router.post("/dashboard/logout", auth.checkSession, dash.logout);

//----------- User management -----------------//

router.get("/user-management", auth.checkSession, user_man.getUserManagement);

router.patch("/user-management/update-status/:id", auth.checkSession, user_man.updateUserStatus);

router.get("/user-management/user-details", auth.checkSession, user_man.getUserDetails);

//----------- Catogery management -----------------//

router.get("/category-management", auth.checkSession, cat_man.getCategory);

router.post("/category-management/edit-category", auth.checkSession, cat_man.editCategory);

router.post("/category-management/add-category", auth.checkSession, cat_man.addCategory);

router.patch("/category-management/update-status/:id", auth.checkSession, cat_man.editCategoryStatus);

//----------- Product management -----------------//

router.get("/product-management", auth.checkSession, prd_man.getProduts);

router.patch("/product-management/update-status/:id", auth.checkSession, prd_man.updateProductStatus);

router.get("/product-management/add-product", auth.checkSession, prd_man.getAddProduct);

router.post("/product-management/add-product", auth.checkSession, productImageUpload.array("croppedImage[]", 10), prd_man.postAddProduct);

router.get("/product-management/edit-product/:id", auth.checkSession, prd_man.getEditProduct);

router.post("/product-management/edit-product/:id", auth.checkSession, productImageUpload.array("croppedImage[]", 10), prd_man.postEditProduct);

//----------- Order management -----------------//

router.post("/order-management/update-status/:orderId", order.updateOrderStatus);

module.exports = router;
