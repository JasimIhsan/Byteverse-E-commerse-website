const User = require("../../model/user");
const Orders = require("../../model/orders");
const Address = require("../../model/Address");
const Products = require("../../model/product");
const Wishlist = require("../../model/wishlist");
const Wallet = require("../../model/wallet");
const bcrypt = require("bcrypt");
const user = require("../../model/user");

const getProfile = async (req, res) => {
    try {
        const title = "Dashboard | Byteverse E-commerce";
        const userId = req.session.userId;

        const userLoggedIn = req.session.user ? true : false;

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const user = await User.findById(userId).populate("defaultAddress").exec();
        const orders = await Orders.find({ userId }).populate("products.productId").exec();

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

const updateProfile = async (req, res) => {
    try {
        console.log("updaing profile");

        const { name, mobileNumber } = req.body;
        const userId = req.session.userId;

        User.findByIdAndUpdate(userId, { username: name, mobileNumber: mobileNumber }, { new: true })
            .then((updatedUser) => {
                res.json({ success: true, user: updatedUser });
            })
            .catch((error) => {
                console.error("Error updating user:", error);
                res.json({ success: false, message: "Failed to update profile." });
            });
    } catch (error) {
        console.error("Error from post update profile  :  \n", error);
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    try {
        const user = await User.findById(userId);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Current password is incorrect." });
        }

        const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);
        if (isSameAsCurrent) {
            return res.json({ success: false, message: "New password cannot be the same as the current password." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        return res.json({ success: true });
    } catch (error) {
        console.error("Error updating password:", error);
        res.json({ success: false, message: "Error updating password." });
    }
};

//------------------- orders ---------------//

const getOrders = async (req, res) => {
    try {
        const title = "Orders | Byteverse E-commerce";
        const userLoggedIn = req.session.userId ? true : false;
        const userId = req.session.userId;

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const user = await User.findById(userId);
        if (!user) return res.redirect("/login");

        let filter = { userId: userId };

        const { status, dateRange } = req.query;
        if (status && status !== "all") {
            filter.deliveryStatus = status;
        }

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

        const orders = await Orders.find(filter).populate("products.productId").populate("address").sort({ orderTime: -1 });

        res.render("user/orders", { title, userLoggedIn, user, orders, userId });
    } catch (error) {
        console.error("Error fetching orders: ", error);
        res.status(500).send("Internal Server Error");
    }
};

const cancelOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: "Order not found." });
        }

        if (order.paymentStatus === "completed") {
            const userId = order.userId;

            const wallet = await Wallet.findOne({ userId: userId });
            if (wallet) {
                const refundAmount = order.total;
                wallet.balance += refundAmount;

                const newBalance = wallet.balance;

                wallet.transactions.push({
                    transactionId: `REFUND-${orderId}`,
                    type: "credit",
                    amount: refundAmount,
                    newBalance: newBalance,
                    description: `Refund for cancelled order #${orderId}`,
                    status: "completed",
                });

                await wallet.save();
            } else {
                console.error("Wallet not found for user:", userId);
            }
        }

        order.deliveryStatus = "Cancelled";
        order.cancellationReason = reason;
        await order.save();

        for (const item of order.products) {
            const productId = item.productId;
            const product = await Products.findById(productId);

            if (product) {
                console.log(`Restoring stock for product: ${productId}`);
                product.stock += item.quantity;
                await product.save();
            } else {
                console.error(`Product not found: ${productId}`);
            }
        }

        return res.json({ success: true, message: "Order cancelled successfully." });
    } catch (err) {
        console.error("Error cancelling order:", err);
        return res.json({ success: false, message: "Something went wrong." });
    }
};

const getOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = Boolean(req.session.userId);

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const orderId = req.params.orderId;

        const user = await User.findById(userId);
        const order = await Orders.findById(orderId).populate("products.productId").populate("address").exec();

        console.log(order);

        res.render("user/orderdetail", { userLoggedIn, user, order });
    } catch (error) {
        console.error("Error from get order detail page : \n", error);
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

//------------------ wallet -------------------//

const getWallet = async (req, res) => {
    try {
        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const userId = req.session.userId;
        const userLoggedIn = Boolean(req.session.userId);

        const page = parseInt(req.query.page) || 1;
        const limit = 10;

        let wallet = await Wallet.findOne({ userId: userId });
        const user = await User.findById(userId);

        if (!wallet) {
            wallet = new Wallet({
                userId: userId,
                balance: 0,
                transactions: [],
            });

            await wallet.save();
        }

        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        const startIndex = (page - 1) * limit;
        const paginatedTransactions = wallet.transactions.slice(startIndex, startIndex + limit);

        res.render("user/wallet", {
            wallet: {
                ...wallet.toObject(),
                transactions: paginatedTransactions.map((transaction) => ({
                    ...transaction,
                    newBalance: transaction.newBalance || wallet.balance,
                })),
            },
            page,
            user,
            userLoggedIn,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching wallet:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addMoney = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).send("Invalid amount");
        }

        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.status(404).send("Wallet not found");
        }

        wallet.balance += parseFloat(amount);
        wallet.transactions.unshift({
            transactionId: `txn_${Date.now()}`,
            type: "credit",
            amount: parseFloat(amount),
            description: "Money added to wallet",
            status: "completed",
            newBalance: wallet.balance,
        });

        await wallet.save();

        res.redirect("/wallet");
    } catch (error) {
        console.error("Error adding money:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getAddress,
    getAddAddress,
    postAddAddress,
    deleteAddress,
    editAddress,
    updateAddress,
    getOrders,
    cancelOrder,
    getOrderDetails,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getWallet,
    addMoney,
};
