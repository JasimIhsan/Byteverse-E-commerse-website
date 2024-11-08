const Order = require("../../model/orders");
const Products = require("../../model/product");
const Wallet = require("../../model/wallet");

// controller for getting order management page - get method
const getOrderManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";

        const orders = await Order.find().populate("userId", "username").populate("products.productId").sort({ createdAt: -1 }).exec();

        const filteredOrders = orders.filter((order) => {
            const userExists = order.userId && order.userId.username;
            return userExists && (order.userId.username.toLowerCase().includes(search.toLowerCase()) || order._id.toString().includes(search));
        });

        const totalFilteredOrders = filteredOrders.length;
        const totalPages = Math.ceil(totalFilteredOrders / limit);
        const paginatedOrders = filteredOrders.slice(skip, skip + limit);

        // const totalFilteredOrders = orders.length;
        // const totalPages = Math.ceil(totalFilteredOrders / limit);
        // const paginatedOrders = orders.slice(skip, skip + limit);

        res.render("admin/orders", {
            orders: paginatedOrders,
            currentPage: page,
            totalPages,
            search,
        });
    } catch (error) {
        console.error("Error from get Order management: \n", error);
        res.status(500).send("Internal Server Error");
    }
};

// controller for updating order status ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"]- post method
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        const existingOrder = await Order.findById(orderId).populate("products.productId");

        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        const wallet = await Wallet.findOne({ userId: existingOrder.userId });
        if (!wallet) {
            return res.status(404).json({ message: "User wallet not found" });
        }

        if (existingOrder.deliveryStatus !== "Cancelled" && deliveryStatus === "Cancelled") {
            for (const item of existingOrder.products) {
                const product = item.productId;
                if (product) {
                    await Products.findByIdAndUpdate(product._id, {
                        $inc: { stock: item.quantity },
                    });
                }
            }
        } else if (existingOrder.deliveryStatus === "Cancelled" && deliveryStatus !== "Cancelled") {
            for (const item of existingOrder.products) {
                const product = item.productId;
                if (product) {
                    await Products.findByIdAndUpdate(product._id, {
                        $inc: { stock: -item.quantity },
                    });
                }
            }
        }

        let updateFields = { deliveryStatus };

        if (deliveryStatus === "Returned") {
            if (existingOrder.paymentStatus === "Paid") {
                const refundAmount = existingOrder.total;

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

                updateFields.paymentStatus = "Refunded";
                updateFields.returnReason = "Order was returned by admin";
            }
        } else if (deliveryStatus === "Cancelled") {
            if (existingOrder.paymentStatus === "Paid") {
                const refundAmount = existingOrder.total;

                wallet.balance += refundAmount;
                wallet.transactions.push({
                    transactionId: `ord_cnl_${Date.now()}`,
                    type: "Refund",
                    amount: refundAmount,
                    description: `Refund for cancelled order ${orderId}`,
                    status: "completed",
                    date: new Date(),
                });

                await wallet.save();

                updateFields.paymentStatus = "Refunded";
                updateFields.cancellationReason = "Order was cancelled by admin";
            }
        } else if (deliveryStatus === "Delivered" && existingOrder.paymentStatus === "Pending") {
            updateFields.paymentStatus = "Paid";
        }

        if (deliveryStatus !== "Cancelled") {
            updateFields.$unset = { cancellationReason: 1 };
        }
        if (deliveryStatus !== "Returned") {
            updateFields.$unset = { returnReason: 1 };
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, updateFields, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order status updated successfully." });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Error updating order status." });
    }
};

// controller for getting order detail page - get method
const getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId).populate("userId").populate("products.productId").exec();

        if (!order) {
            return res.status(404).send("Order not found");
        }

        const orderItems = [];
        for (let item of order.products) {
            const product = item.productId;
            const quantity = item.quantity;

            orderItems.push({
                productId: product._id,
                quantity: quantity,
                price: product.price * quantity,
            });
        }

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0), 0);

        res.render("admin/orderdetail", { order, subtotal });
    } catch (error) {
        console.error("Error from get admin product detail page : \n", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getOrderManagement,
    updateOrderStatus,
    getOrderDetail,
};
