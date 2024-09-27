const express = require("express");
const router = express.Router();
const admin = require("../../Controller/adminController");

router.get("/", admin.getAdminLogin);

router.get("/dashboard", admin.getAdminDashboard);

router.post("/dashboard", admin.postAdminLogin);

module.exports = router;
