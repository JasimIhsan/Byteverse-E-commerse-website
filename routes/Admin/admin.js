const express = require("express");
const router = express.Router();
const admin = require("../../Controller/adminController");

router.get("/", admin.getAdminLogin);

router.post("/admin", admin.postAdminLogin);

module.exports = router;
