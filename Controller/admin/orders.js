const Order = require("../../model/orders");

const getOrderManagement = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page
        const limit = 10; // Number of orders per page
        const skip = (page - 1) * limit; // Documents to skip for pagination
        const search = req.query.search || ""; // Search term

        // Find orders with pagination and search
        const orders = await Order.find()
            .populate("userId", "username") // Populate only the username field
            .populate("products.productId")
            .limit(limit)
            .skip(skip)
            .exec();

        // Count total orders for pagination
        const totalOrders = await Order.countDocuments();

        // If search is applied, filter orders based on username or order ID
        const filteredOrders = orders.filter((order) => {
            const userExists = order.userId && order.userId.username;
            return (
                userExists &&
                (order.userId.username.toLowerCase().includes(search.toLowerCase()) || // Search by username
                    order._id.toString().includes(search)) // Search by order ID
            );
        });

        // Pagination calculations
        const totalFilteredOrders = filteredOrders.length;
        const totalPages = Math.ceil(totalFilteredOrders / limit); // Calculate total pages

        // Slice the filtered orders for current page
        const paginatedOrders = filteredOrders.slice(skip, skip + limit);

        // Render the orders page with pagination data
        res.render("admin/orders", {
            orders: paginatedOrders,
            currentPage: page,
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
    }
};

const cancelOrderItem = async (req, res) => {
    try {
        console.log("Cancelling order");

        const { orderId, productId } = req.body;

        // Find the order by ID
        const order = await Order.findById(orderId);
        console.log("Order found:", order); // Log the found order

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Check current products in the order
        console.log("Current products in order:", order.products);

        // Remove the product from the order
        const initialProductCount = order.products.length; // Before removal
        order.products = order.products.filter((product) => product.productId.toString() !== productId);

        // Calculate the new total
        order.total = order.products.reduce((acc, product) => acc + product.price * product.quantity, 0);
        const newProductCount = order.products.length; // After removal

        await order.save();

        console.log(`Product removed: ${initialProductCount - newProductCount} products removed.`); // Log removal

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
