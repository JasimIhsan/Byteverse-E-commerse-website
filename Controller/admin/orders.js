const Order = require("../../model/orders");

const getOrderManagement = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (page - 1) * limit;
        const regex = new RegExp(search, "i");

        const ordersQuery = Order.find().populate("userId").populate("products.productId");

        if (search) {
            ordersQuery.find({
                $or: [
                    { "userId.username": { $regex: regex } }, // Use the correct field for username
                    { "products.productId.name": { $regex: regex } },
                ],
            });
        }

        const totalOrders = await Order.countDocuments(
            search
                ? {
                      $or: [{ "userId.username": { $regex: regex } }, { "products.productId.name": { $regex: regex } }],
                  }
                : {}
        );

        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await ordersQuery.skip(skip).limit(limit).exec();

        res.render("admin/orders", {
            orders,
            currentPage: Number(page),
            totalPages,
            search,
        });
    } catch (error) {
        console.error("Error from get Order management: \n", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        console.log("Order ID:", orderId);
        console.log("New Delivery Status:", deliveryStatus);

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { deliveryStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Error updating status" });
    }
};

module.exports = {
    getOrderManagement,
    updateOrderStatus,
};
