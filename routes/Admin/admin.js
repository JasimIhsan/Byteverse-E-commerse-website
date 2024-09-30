const express = require("express");
const router = express.Router();
const dash = require("../../Controller/admin/dashboard");
const user_man = require("../../Controller/admin/userManagment");
const cat_man = require("../../Controller/admin/catogory");

//----------- dashboard -----------------//

router.get("/", dash.getAdminLogin);

router.get("/dashboard", dash.getAdminDashboard);

router.post("/dashboard", dash.postAdminLogin);

//----------- User management -----------------//

router.get("/user-management", user_man.getUserManagement);

router.patch("/user-management/update-status/:id", user_man.updateUserStatus);

router.get("/user-management/user-details", user_man.getUserDetails);

//----------- Catogery management -----------------//

router.get("/category", cat_man.getCategory);

module.exports = router;
