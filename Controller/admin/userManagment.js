const { findOneAndDelete } = require("../../model/OTP");
const User = require("../../model/user");

const getUserManagement = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const users = await User.find({ username: { $regex: regex } })
            .sort({ joinedAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments({ username: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalUsers / limit);
        res.render("admin/userManagement", { users: users, search: search, currentPage: Number(page), totalPages });
    } catch (error) {
        console.error("Error from Rendering userManagement : \n", error);
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const newStatus = req.body.status;

        await User.findByIdAndUpdate(userId, { status: newStatus });

        //reload the page again after updating
        // location.reload();
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating user status : \n", error);
        res.json({ success: false });
    }
};

const getUserDetails = async (req, res) => {
    try {
        res.render("admin/userdetails");
    } catch (error) {
        console.error("Error from get user details : \n", error);
    }
};

module.exports = {
    getUserManagement,
    updateUserStatus,
    getUserDetails,
};
