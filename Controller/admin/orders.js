const Order = require("../../model/orders");

const getOrderManagement = async (req, res) => {
    try {
        const orders = await Order.find().populate("userId").populate("products.productId").exec();

        res.render("admin/orders", { orders });
    } catch (error) {
        console.error("Error from get Order management : \n", error);
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
