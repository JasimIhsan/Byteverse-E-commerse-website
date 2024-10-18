const User = require("../../model/user");
const Orders = require("../../model/orders");
const Address = require("../../model/Address");
const Products = require("../../model/product");
const Wishlist = require("../../model/wishlist");

const getProfile = async (req, res) => {
    try {
        const title = "Dashboard | Byteverse E-commerce";
        const userId = req.session.userId;

        const userLoggedIn = req.session.user ? true : false;

        const user = await User.findById(userId).populate("defaultAddress").exec();
        const orders = await Orders.find({ userId }).populate("products.productId").exec();

        // Render the user dashboard with retrieved data
        res.render("user/dashboard", {
            user,
            userLoggedIn,
            orders,
            title,
        });
    } catch (error) {
        console.error("Error from get dashboard of user: \n", error);
    }
};

//------------------- orders ---------------//

const getOrders = async (req, res) => {
    try {
        const title = "Orders | Byteverse E-commerce";
        const userLoggedIn = req.session.userId ? true : false;
        const userId = req.session.userId;

        const user = await User.findById(userId);
        if (!user) return res.redirect("/login");

        let filter = { userId: userId };

        //filter based on status
        const { status, dateRange } = req.query;
        if (status && status !== "all") {
            filter.deliveryStatus = status;
        }

        //filter based on date
        const currentDate = new Date();
        if (dateRange) {
            switch (dateRange) {
                case "week":
                    filter.orderDate = { $gte: new Date(currentDate.setDate(currentDate.getDate() - 7)) };
                    break;
                case "twoWeeks":
                    filter.orderDate = { $gte: new Date(currentDate.setDate(currentDate.getDate() - 14)) };
                    break;
                case "month":
                    filter.orderDate = { $gte: new Date(currentDate.setMonth(currentDate.getMonth() - 1)) };
                    break;
                case "threeMonths":
                    filter.orderDate = { $gte: new Date(currentDate.setMonth(currentDate.getMonth() - 3)) };
                    break;
            }
        }

        const orders = await Orders.find(filter).populate("products.productId").populate("Address").sort({ orderTime: -1 });

        res.render("user/orders", { title, userLoggedIn, user, orders, userId });
    } catch (error) {
        console.error("Error fetching orders: ", error);
        res.status(500).send("Internal Server Error");
    }
};

const cancelOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        // Update the delivery status and reason directly in the database
        const order = await Orders.findByIdAndUpdate(
            orderId,
            {
                deliveryStatus: "Cancelled",
                cancellationReason: reason,
            },
            { new: true }
        ); // { new: true } returns the updated order document

        if (!order) {
            return res.json({ success: false, message: "Order not found." });
        }

        console.log("Updated status: ", order.deliveryStatus);

        // Restore stock for each product in the order
        for (const item of order.products) {
            const productId = item.productId; // Get the product ID
            const product = await Products.findById(productId); // Fetch the product document

            if (product) {
                console.log(`Restoring stock for product: ${productId}`);
                product.stock += item.quantity; // Restore stock by adding the quantity
                await product.save(); // Save the updated product
            } else {
                console.error(`Product not found: ${productId}`);
            }
        }

        return res.json({ success: true, message: "Order cancelled successfully." });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Something went wrong." });
    }
};

//------------------ address -------------------//

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

//------------------ wishlist -------------------//

const getWishlist = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 6;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");
        const userId = req.session.userId;
        const userLoggedIn = Boolean(req.session.userId);

        const user = await User.findById(userId);

        const wishlist = await Wishlist.findOne({ userId: userId })
            .populate({ path: "products", match: { name: regex } })
            .skip(skip)
            .limit(limit);

        if (wishlist) {
            wishlist.products.reverse();
        }

        const products = wishlist ? wishlist.products : [];

        res.render("user/wishlist", { userLoggedIn, search, user, products });
    } catch (error) {
        console.log(error);
    }
};

const addToWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId: userId, products: [productId] });
            await wishlist.save();

            return res.status(200).json({
                success: true,
                message: "Wishlist created and product added.",
                wishlist: wishlist,
            });
        } else {
            if (!wishlist.products.includes(productId)) {
                wishlist.products.push(productId);
                await wishlist.save();

                return res.status(200).json({
                    success: true,
                    message: "Product added to wishlist.",
                });
            } else {
                return res.status(200).json({
                    success: true,
                    alreadyInWishlist: "Product is already in the wishlist.",
                });
            }
        }
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
            error: error.message,
        });
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        let wishlist = await Wishlist.findOne({ userId: userId });

        if (!wishlist) {
            return res.status(404).json({ success: false, message: "Wishlist not found" });
        }

        wishlist.products = wishlist.products.filter((p) => !p.equals(productId));

        await wishlist.save();

        return res.status(200).json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
        console.error("Error removing product from wishlist:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
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
    getOrders,
    cancelOrder,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};
