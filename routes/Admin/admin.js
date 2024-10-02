const express = require("express");
const router = express.Router();
const dash = require("../../Controller/admin/dashboard");
const user_man = require("../../Controller/admin/user");
const cat_man = require("../../Controller/admin/catogory");
const prd_man = require("../../Controller/admin/products");
const productImageUpload = require("../../config/multer");
const { log } = require("debug/src/browser");

//----------- dashboard -----------------//

router.get("/", dash.getAdminLogin);

router.get("/dashboard", dash.getAdminDashboard);

router.post("/dashboard", dash.postAdminLogin);

//----------- User management -----------------//

router.get("/user-management", user_man.getUserManagement);

router.patch("/user-management/update-status/:id", user_man.updateUserStatus);

router.get("/user-management/user-details", user_man.getUserDetails);

//----------- Catogery management -----------------//

router.get("/category-management", cat_man.getCategory);

router.post("/category-management/edit-category", cat_man.editCategory);

router.post("/category-management/add-category", cat_man.addCategory);

router.patch("/category-management/update-status/:id", cat_man.editCategoryStatus);

//----------- Product management -----------------//

router.get("/product-management", prd_man.getProduts);

router.patch("/product-management/update-status/:id", prd_man.updateProductStatus);

router.get("/product-management/add-product", prd_man.getAddProduct);

router.post("/product-management/add-product", productImageUpload.array("croppedImage[]", 10), prd_man.postAddProduct);
// router.post("/product-management/add-product", productImageUpload.array("images[]", 10), (req,res)=>{
//     console.log('dstfghs');
//     res.status(201)
// });

// router.post("/product-management/add-product", productImageUpload.any(), (req,res)=>{
//     console.log(req.files);
//     res.status(201)
// });

router.get("/product-management/edit-product/:id", prd_man.getEditProduct);

router.post("/product-management/edit-product/:id", prd_man.postEditProduct);

module.exports = router;
