const Order = require("../../model/orders");
const Products = require("../../model/product");

const getOrderManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page from the query or default to 1
        const limit = 10; // Number of orders per page
        const skip = (page - 1) * limit; // Calculate how many orders to skip for pagination
        const search = req.query.search || ""; // Get the search query from the request

        // Fetch all orders with user and product details
        const orders = await Order.find().populate("userId", "username").populate("products.productId").exec();

        // Filter orders based on search criteria
        const filteredOrders = orders.filter((order) => {
            const userExists = order.userId && order.userId.username;
            return (
                userExists &&
                (order.userId.username.toLowerCase().includes(search.toLowerCase()) || // Search by username
                    order._id.toString().includes(search)) // Or search by order ID
            );
        });

        // Calculate pagination parameters
        const totalFilteredOrders = filteredOrders.length; // Count the filtered orders
        const totalPages = Math.ceil(totalFilteredOrders / limit); // Total pages based on filtered count
        const paginatedOrders = filteredOrders.slice(skip, skip + limit); // Get the specific orders for the current page

        // Render the order management page with the necessary data
        res.render("admin/orders", {
            orders: paginatedOrders,
            currentPage: page, // Set currentPage to the actual page number
            totalPages,
            search,
        });
    } catch (error) {
        console.error("Error from get Order management: \n", error);
        res.status(500).send("Internal Server Error"); // Send a 500 error response
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        const existingOrder = await Order.findById(orderId).populate("products.productId");

        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (existingOrder.deliveryStatus !== "Cancelled" && deliveryStatus === "Cancelled") {
            console.log("Order is being cancelled. Incrementing stock...");
            for (const item of existingOrder.products) {
                const product = item.productId;
                if (product) {
                    await Products.findByIdAndUpdate(product._id, {
                        $inc: { stock: item.quantity },
                    });
                }
            }
        } else if (existingOrder.deliveryStatus === "Cancelled" && deliveryStatus !== "Cancelled") {
            console.log("Restoring cancelled order. Decreasing stock...");
            for (const item of existingOrder.products) {
                const product = item.productId;
                if (product) {
                    await Products.findByIdAndUpdate(product._id, {
                        $inc: { stock: -item.quantity },
                    });
                }
            }
        }

        const updateFields = { deliveryStatus };
        if (deliveryStatus !== "Cancelled") {
            updateFields.$unset = { cancellationReason: 1 };
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

const getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // console.log("orderID", orderId);

        // Fetch order details from the database
        const order = await Order.findById(orderId)
            .populate("userId") // Populate userId if needed
            .populate("products.productId") // Correctly populate products.productId
            .populate("Address") // Populate Address if needed
            .exec();

        // console.log(order);

        if (!order) {
            return res.status(404).send("Order not found adfas");
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
    }
};

const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, productId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const initialProductCount = order.products.length;
        order.products = order.products.filter((product) => product.productId.toString() !== productId);

        order.total = order.products.reduce((acc, product) => acc + product.price * product.quantity, 0);
        const newProductCount = order.products.length;

        if (newProductCount === 0) {
            await Order.deleteOne({ _id: orderId });
            console.log("Order deleted as no items are left...");
            return res.json({ message: "Order deleted successfully" });
        }

        await order.save();

        console.log(`Product removed: ${initialProductCount - newProductCount} products removed.`);

        res.json({ message: "Product removed successfully", order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getOrderManagement,
    updateOrderStatus,
    getOrderDetail,
    cancelOrderItem,
};
