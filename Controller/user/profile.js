const User = require("../../model/user");
const Orders = require("../../model/orders");
const Address = require("../../model/Address");

const getProfile = async (req, res) => {
    try {
        const title = "Dashboard | Byteverse E-commerse";

        const userId = req.session.userId;

        const user = await User.findById(userId);

        if (user == null) return res.redirect("/login");

        const userLoggedIn = req.session.user ? true : false;
        res.render("user/dashboard", { title, userLoggedIn, user });
    } catch (error) {
        console.error("Error from get dashboard of user : \n", error);
    }
};

const getAddress = async (req, res) => {
    try {
        const title = "Address page | Byteverse E-commerce";

        const sessionUserId = req.session.userId;
        const paramUserId = req.params.userId;

        if (!sessionUserId || sessionUserId !== paramUserId) {
            return res.redirect("/login");
        }

        const user = await User.findById(sessionUserId);
        const orders = await Orders.find({ userId: sessionUserId });
        const addresses = await Address.find({ userId: sessionUserId });

        const success_msg = req.query.success;
        const error_msg = req.query.error;
        const userLoggedIn = req.session.user ? true : false;
        res.render("user/address", { title, user, orders, addresses, userLoggedIn, success_msg, error_msg });
    } catch (error) {
        console.error("Error from Get Profile page : \n", error);
    }
};

const getAddAddress = async (req, res) => {
    try {
        const title = "Add Address | Byteverse E-commerse";

        const userLoggedIn = req.session.user ? true : false;

        const sessionUserId = req.session.userId;
        const user = await User.findById(sessionUserId);
        const orders = await Orders.find({ userId: sessionUserId });
        const address = await Address.find({ userId: sessionUserId });

        res.render("user/addaddress", { title, userLoggedIn, user, orders, address });
    } catch (error) {
        console.error("Error from add address from user : \n", error);
    }
};

const postAddAddress = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo, isDefault } = req.body;
        const userId = req.params.userId;

        if (isDefault === "on") {
            await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
        }

        const newAddress = new Address({
            userId: userId,
            firstName,
            lastName,
            phoneNumber,
            street,
            city,
            state,
            postalCode,
            country,
            additionalInfo,
            isDefault: isDefault === "on",
        });

        await newAddress.save();

        res.redirect(`/${userId}/profile/address`);
    } catch (error) {
        console.error("Error from post add address : \n", error);
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const addressId = req.params.addressId;
        const sessionUserId = req.session.userId;

        // console.log("sessionuserid : ", sessionUserId);
        // console.log("param         : ", user);
        // console.log("addressId     : ", addressId);

        // console.log("here");

        const result = await Address.findOneAndDelete({ _id: addressId, userId });
        console.log(result);

        if (!result) {
            return res.redirect(`/${userId}/profile/address?error=Address not found`);
        }
        // console.log("at");

        res.redirect(`/${userId}/profile/address?success=Address deleted successfully`);
    } catch (error) {
        console.error("Error from dleteing address : \n", error);
    }
};

const editAddress = async (req, res) => {
    try {
        const title = "Edit Address | Byteverse E-commerce";

        const userLoggedIn = req.session.user ? true : false;
        const userId = req.session.userId;
        const addressId = req.params.addressId;
        const user = await User.findById(userId);
        const address = await Address.findById(addressId);

        if (user == null || address == null) return res.redirect("/login");

        res.render("user/editaddress", { title, userLoggedIn, user, address });
    } catch (error) {
        console.error("Error from editing the address : \n", error);
    }
};

const updateAddress = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo, isDefault } = req.body;
        const { userId, addressId } = req.params;
        console.log("edit il keri");

        if (isDefault === "on") {
            await Address.updateMany({ userId, isDefault: true }, { isDefault: false });
        }

        await Address.findByIdAndUpdate(
            addressId,
            {
                firstName,
                lastName,
                phoneNumber,
                street,
                city,
                state,
                postalCode,
                country,
                additionalInfo,
                isDefault: isDefault === "on",
            },
            { new: true }
        );

        res.redirect(`/${userId}/profile/address?sucess=Address updated successfully`);
    } catch (error) {
        console.error("Error from posting update address : \n", error);
    }
};

module.exports = {
    getProfile,
    getAddress,
    getAddAddress,
    postAddAddress,
    deleteAddress,
    editAddress,
    updateAddress,
};
