const { findOneAndDelete } = require("../../model/OTP");
const User = require("../../model/user");
const Order = require("../../model/orders");
const Wallet = require("../../model/wallet");

// controller for getting user management page - get method
const getUserManagement = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const users = await User.find({ username: { $regex: regex } })
            .skip(skip)
            .limit(limit);

        const wallet = await Wallet.find();

        const totalUsers = await User.countDocuments({ username: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalUsers / limit);
        res.render("admin/userManagement", { users: users, search: search, currentPage: Number(page), totalPages, wallet });
    } catch (error) {
        console.error("Error from Rendering userManagement : \n", error);
    }
};

// controller for updating the user status (block and unblock) - patch method
const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const newStatus = req.body.status;

        const updatedUser = await User.findByIdAndUpdate(userId, { status: newStatus });

        if (updatedUser && newStatus == "Blocked") {
            req.session.userId = null;
            req.session.user = false;
            console.log(`User with ID ${userId} has been blocked and their session cleared.`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating user status : \n", error);
        res.json({ success: false });
    }
};

// controller for user detail page - get method
const getUserDetails = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).populate("defaultAddress");

        const orders = await Order.find({ userId }).populate("products.productId").sort({ createdAt: -1 });

        console.log("orderssss : ", orders);

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("admin/userdetail", { user, orders });
    } catch (error) {
        console.error("Error from get user details : \n", error);
    }
};

module.exports = {
    getUserManagement,
    updateUserStatus,
    getUserDetails,
};
