const User = require("../../model/user");
const Orders = require("../../model/orders");
const Address = require("../../model/Address");
const Products = require("../../model/product");
const Wishlist = require("../../model/wishlist");
const Wallet = require("../../model/wallet");
const bcrypt = require("bcrypt");
const user = require("../../model/user");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// controller for get user profile - get method
const getProfile = async (req, res) => {
    try {
        const title = "Dashboard | Byteverse E-commerce";
        const userId = req.session.userId;
        const userLoggedIn = req.session.user ? true : false;

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

// controller for update user profile ( update username and mobile number ) - post method
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

// controller for change password user - post method
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

// controller for get all orders in user profile - get method
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

        const { status, dateRange, page = 1 } = req.query;
        const limit = 5; // Number of orders per page
        const skip = (page - 1) * limit;

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

        // Fetch orders with pagination
        const orders = await Orders.find(filter).populate("products.productId").populate("address").sort({ orderTime: -1 }).skip(skip).limit(limit);

        // Get total count of orders for pagination
        const totalOrders = await Orders.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render("user/orders", {
            title,
            userLoggedIn,
            user,
            orders,
            userId,
            currentPage: parseInt(page),
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching orders: ", error);
        res.status(500).send("Internal Server Error");
    }
};

// controller for cancel order reason needed to cancell order - post method
const cancelOrder = async (req, res) => {
    const { orderId, reason } = req.body;

    try {
        const order = await Orders.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: "Order not found." });
        }

        if (order.paymentMethod !== "Cash on Delivery" && order.paymentStatus == "Paid") {
            const userId = order.userId;

            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                console.error("Wallet not found for user:", userId);
                return res.json({ success: false, message: "Wallet not found." });
            }

            const refundAmount = order.total;
            wallet.balance += refundAmount;

            wallet.transactions.push({
                transactionId: `REFUND-${orderId}`,
                type: "Refund",
                amount: refundAmount,
                description: `Refund for cancelled order #${orderId}`,
                status: "completed",
            });

            await wallet.save();
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

// controller for return order reason needed to return - post method
const returnOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.deliveryStatus !== "Delivered" || order.paymentStatus !== "Paid") {
            return res.status(400).json({ message: "Order is not eligible for a return" });
        }

        const wallet = await Wallet.findOne({ userId: order.userId });

        if (!wallet) {
            return res.status(404).json({ message: "User wallet not found" });
        }

        const refundAmount = order.total;

        wallet.balance += refundAmount;
        wallet.transactions.push({
            transactionId: `ord_rtn_${Date.now()}`,
            type: "Refund",
            amount: refundAmount,
            description: `Refund for order ${orderId}`,
            status: "completed",
            date: new Date(),
        });

        await wallet.save();

        order.paymentStatus = "Refunded";
        order.deliveryStatus = "Returned";
        order.returnReason = reason;
        await order.save();

        res.status(200).json({ message: "Order returned and refunded successfully", wallet });
    } catch (error) {
        console.error("Error processing order return:", error.message);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

// controller for get order detail page - get method
const getOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = Boolean(req.session.userId);

        const orderId = req.params.orderId;

        const user = await User.findById(userId);
        const order = await Orders.findById(orderId).populate("products.productId").populate("address").exec();

        res.render("user/orderdetail", { userLoggedIn, user, order });
    } catch (error) {
        console.error("Error from get order detail page : \n", error);
    }
};

// controller for download invoice, only download if the delivery status is delivered - post method
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Orders.findById(orderId).populate("products.productId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${orderId}.pdf`);

        // Generate and pipe the PDF
        const doc = await generateInvoice(order);
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).json({ message: "Error generating invoice" });
    }
};

// function for generation invoice, returns the pdf of invoice
const generateInvoice = async (
    order,
    companyInfo = {
        name: "Byteverse E-commerce Website",
        address: {
            street: "123 Business Street",
            city: "City Name",
            state: "State",
            postalCode: "12345",
            country: "Country",
        },
        phone: "+1 (234) 567-8900",
        email: "contact@byteverse.com",
        website: "www.byteverse.com",
    }
) => {
    const doc = new PDFDocument({ margin: 50 });

    // Define consistent positioning values
    const leftMargin = 50;
    const rightMargin = doc.page.width - 50;
    const contentWidth = rightMargin - leftMargin;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const drawHorizontalLine = (y = doc.y) => {
        doc.strokeColor("#cccccc").lineWidth(1).moveTo(leftMargin, y).lineTo(rightMargin, y).stroke();
    };

    // Invoice Header - Centered
    doc.fontSize(24).font("Helvetica-Bold").text("INVOICE", leftMargin, 50, {
        width: contentWidth,
        align: "center",
    });

    // Invoice Number and Date - Centered under heading
    doc.fontSize(10)
        .font("Helvetica")
        .text(`Invoice No: ${order._id}`, leftMargin, 85, {
            width: contentWidth,
            align: "center",
        })
        .text(`Date: ${formatDate(new Date())}`, leftMargin, 100, {
            width: contentWidth,
            align: "center",
        });

    drawHorizontalLine(130);

    // Company Information Section
    doc.fontSize(12).font("Helvetica-Bold").text("From:", leftMargin, 150);

    doc.fontSize(11).font("Helvetica-Bold").text(companyInfo.name, leftMargin, 170);

    doc.fontSize(10).font("Helvetica").text(companyInfo.address.street, leftMargin, 190).text(`${companyInfo.address.city}, ${companyInfo.address.state} ${companyInfo.address.postalCode}`).text(companyInfo.address.country).text(`Phone: ${companyInfo.phone}`).text(`Email: ${companyInfo.email}`).text(`Website: ${companyInfo.website}`);

    drawHorizontalLine(270);

    // Two Column Layout - Order Details and Shipping Address
    // Left Column - Order Details
    doc.fontSize(12).font("Helvetica-Bold").text("Order Details", leftMargin, 290);

    const detailsStartY = 315;
    const detailsLeftCol = leftMargin;
    const detailsRightCol = leftMargin + 100;

    // Order Details - Left aligned with consistent spacing
    doc.fontSize(10).font("Helvetica-Bold").text("Order Status:", detailsLeftCol, detailsStartY).font("Helvetica").text(order.deliveryStatus, detailsRightCol, detailsStartY);

    doc.font("Helvetica-Bold")
        .text("Payment Method:", detailsLeftCol, detailsStartY + 20)
        .font("Helvetica")
        .text(order.paymentMethod, detailsRightCol, detailsStartY + 20);

    doc.font("Helvetica-Bold")
        .text("Payment Status:", detailsLeftCol, detailsStartY + 40)
        .font("Helvetica")
        .text(order.paymentStatus, detailsRightCol, detailsStartY + 40);

    // Right Column - Shipping Address
    const addressX = 300;
    doc.fontSize(12).font("Helvetica-Bold").text("Shipping Address", addressX, 290);

    // Address block with consistent spacing
    doc.fontSize(10)
        .font("Helvetica")
        .text(order.address.firstName + " " + order.address.lastName, addressX, detailsStartY)
        .text(order.address.street, addressX, detailsStartY + 15)
        .text(`${order.address.city}, ${order.address.state} ${order.address.postalCode}`, addressX, detailsStartY + 30)
        .text(order.address.country, addressX, detailsStartY + 45)
        .text(`Phone: ${order.address.phoneNumber}`, addressX, detailsStartY + 60);

    drawHorizontalLine(400);

    // Order Items Section
    doc.fontSize(12).font("Helvetica-Bold").text("Order Items", leftMargin, 420);

    // Table Header with precise column widths
    const colProduct = leftMargin;
    const colQuantity = 350;
    const colPrice = 420;
    const colTotal = 490;

    // Table headers
    doc.fontSize(10).font("Helvetica-Bold").text("Product", colProduct, 445).text("Qty", colQuantity, 445).text("Price", colPrice, 445).text("Total", colTotal, 445);

    drawHorizontalLine(465);

    // Table content with precise positioning
    let yPosition = 475;
    order.products.forEach((product) => {
        doc.fontSize(10)
            .font("Helvetica")
            .text(product.productId.name, colProduct, yPosition, { width: 250 })
            .text(product.quantity.toString(), colQuantity, yPosition)
            .text(`$${product.price.toFixed(2)}`, colPrice, yPosition)
            .text(`$${(product.quantity * product.price).toFixed(2)}`, colTotal, yPosition);

        yPosition += 20;
    });

    // Draw line after items
    drawHorizontalLine(yPosition + 10);

    // Summary Section - Right aligned with consistent spacing
    const summaryStartY = yPosition + 30;
    const summaryLabelX = 380;
    const summaryValueX = 490;

    // Summary items
    doc.fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", summaryLabelX, summaryStartY)
        .text(`$${order.total.toFixed(2)}`, summaryValueX, summaryStartY);

    doc.text("Shipping:", summaryLabelX, summaryStartY + 20).text(`$${order.shippingCost.toFixed(2)}`, summaryValueX, summaryStartY + 20);

    let summaryOffset = 40;
    if (order.couponDiscount > 0) {
        doc.text("Coupon Discount:", summaryLabelX, summaryStartY + summaryOffset).text(`-$${order.couponDiscount.toFixed(2)}`, summaryValueX, summaryStartY + summaryOffset);
        summaryOffset += 20;
    }

    if (order.offerDiscount > 0) {
        doc.text("Offer Discount:", summaryLabelX, summaryStartY + summaryOffset).text(`-$${order.offerDiscount.toFixed(2)}`, summaryValueX, summaryStartY + summaryOffset);
        summaryOffset += 20;
    }

    // Final total with separator
    drawHorizontalLine(summaryStartY + summaryOffset + 10);

    const finalTotal = order.total + order.shippingCost - order.couponDiscount - order.offerDiscount;
    doc.fontSize(12)
        .font("Helvetica-Bold")
        .text("Total:", summaryLabelX, summaryStartY + summaryOffset + 20)
        .text(`$${finalTotal.toFixed(2)}`, summaryValueX, summaryStartY + summaryOffset + 20);

    // Footer - Centered at bottom of page
    const footerY = doc.page.height - 100;
    drawHorizontalLine(footerY);

    doc.fontSize(10)
        .font("Helvetica")
        .text("Thank you for your purchase!", leftMargin, footerY + 15, {
            width: contentWidth,
            align: "center",
        })
        .font("Helvetica-Oblique")
        .text("For any questions, please contact our customer support.", leftMargin, footerY + 30, {
            width: contentWidth,
            align: "center",
        });

    return doc;
};

//------------------ address -------------------//

// controller for get address page - get method
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

// controller for getting add address page - get method
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

// controller for adding address - post method
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

// contrller for deleting address - delete method
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

// controller for getting the page for updating address - get method
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

// controller for updating the address - post method
const updateAddress = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo, isDefault } = req.body;
        const { userId, addressId } = req.params;

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

// controller for getting wishlist page - get method
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

// controller for adding product to wishlist - post method
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

// controller for removing product from wishlist - post method
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

// controller for get walet page - get method
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

        let runningBalance = 0;
        const paginatedTransactions = wallet.transactions
            .map((transaction) => {
                runningBalance += transaction.type === "Credit" || transaction.type === "Refund" ? transaction.amount : -transaction.amount;

                return {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    amount: transaction.amount,
                    date: transaction.date.toLocaleDateString(),
                    status: transaction.status,
                    description: transaction.description || "",
                    balanceAfterTransaction: runningBalance,
                };
            })
            .reverse()
            .slice((page - 1) * limit, page * limit);

        res.render("user/wallet", {
            wallet: {
                ...wallet.toObject(),
                transactions: paginatedTransactions,
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

//WALLET ADD MONEY IN RAZORPAY PAGE

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
    returnOrder,
    getOrderDetails,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getWallet,
    downloadInvoice,
};
