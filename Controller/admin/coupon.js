const Coupon = require("../../model/coupon");

// controller for getting coupon management page - get method
const getCoupon = async (req, res) => {
    try {
        const itemsPerPage = 10;
        const currentPage = req.query.page || 1;
        const search = req.query.search || "";
        const regex = new RegExp("^" + search, "i");

        const totalCoupons = await Coupon.countDocuments({
            code: { $regex: regex },
        });
        const coupons = await Coupon.find({ code: { $regex: regex } })
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // console.log(coupons);

        const totalPages = Math.ceil(totalCoupons / itemsPerPage);

        res.render("admin/coupon", {
            coupons,
            currentPage: parseInt(currentPage),
            totalPages,
            search,
        });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        res.status(500).send("Server Error");
    }
};

// controller for creating a new coupon - post method
const addCoupon = async (req, res) => {
    console.log("add coupon controller");

    const { code, discount, expiryDate, usageLimit, minimumSpend } = req.body;

    try {
        console.log("try");

        const newCoupon = new Coupon({
            code,
            discount,
            expiryDate,
            usageLimit: usageLimit || "",
            minimumSpend: minimumSpend || 0,
        });

        console.log("saving");

        await newCoupon.save();

        console.log("saved");

        return res.status(201).json({ message: "Coupon added successfully!", coupon: newCoupon });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to add coupon.", error: error.message });
    }
};

// controller for populating the existing data when open the edit modal - get method
const getCouponById = async (req, res) => {
    const { couponId } = req.params;
    try {
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send("Coupon not found");
        }
        res.json(coupon);
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).send("Server Error");
    }
};

// controller for editing the coupon details - put method
const updateCoupon = async (req, res) => {
    console.log("update coupon controller");

    const { couponId } = req.params;
    const { code, discountAmount, expiryDate, usageLimit, minimumSpend } = req.body;
    console.log("req.body : ", req.body);

    try {
        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { code, discount: discountAmount, expiryDate, usageLimit, minimumSpend }, { new: true });

        console.log("coupon updated");

        if (!updatedCoupon) {
            return res.status(404).send("Coupon not found");
        }

        res.json(updatedCoupon);
    } catch (error) {
        console.error("Error updating coupon:", error);
        res.status(500).send("Server Error");
    }
};

// controller for deleting the coupon - delete method
const deleteCopon = async (req, res) => {
    try {
        const couponId = req.params.couponId;

        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }

        res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// controller for updating the coupon status (activated or deactivated) - post method
const toggleCouponStatus = async (req, res) => {
    const { couponId, newStatus } = req.body;

    try {
        const isActive = newStatus === "Active";

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { isActive }, { new: true });

        if (!updatedCoupon) {
            return res.json({ success: false, message: "Coupon not found" });
        }

        res.json({ success: true, message: `Coupon ${newStatus}d successfully!` });
    } catch (error) {
        console.error("Error toggling coupon status:", error);
        res.status(500).json({ success: false, message: "Error updating coupon status" });
    }
};

module.exports = {
    getCoupon,
    addCoupon,
    getCouponById,
    deleteCopon,
    updateCoupon,
    toggleCouponStatus,
};
