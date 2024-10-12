const User = require("../../model/user");
const Product = require("../../model/product");
const Category = require("../../model/catogory");
const Cart = require("../../model/cart");
const Address = require("../../model/Address");
const Order = require("../../model/orders");

const getCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userId ? true : false;
        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");
        const user = await User.findById(userId);

        req.session.orderPlaced = false;

        if (!cart || cart.Products.length === 0) {
            const error = req.query.error || null;
            const success = req.query.success || null;
            return res.render("user/cart", { cartItems: [], subtotal: 0, total: 0, userLoggedIn, user, error_msg: error, success_msg: success });
        }

        const cartItems = cart.Products.map((item) => ({
            id: item.ProductId._id,
            name: item.ProductId.name,
            price: item.Price,
            quantity: item.Quantity,
            image: item.ProductId.images,
        }));

        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const shippingCost = 20;
        const total = subtotal + shippingCost;

        const error = req.query.error || null;
        const success = req.query.success || null;
        res.render("user/cart", { cartItems, subtotal, total, userLoggedIn, user, error_msg: error, success_msg: success });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ message: "Error fetching cart" });
    }
};

const postAddtoCart = async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.userId;
    const quantity = 1;

    try {
        console.log("Product Id:", productId);
        console.log("Quantity:", quantity);

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in. Please log in to add items to your cart." });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        let cart = await Cart.findOne({ UserId: userId });

        if (!cart) {
            cart = new Cart({ UserId: userId, Products: [] });
        }

        console.log("Cart found/created");

        const productIndex = cart.Products.findIndex((item) => item.ProductId.toString() === productId);

        if (productIndex > -1) {
            console.log("Product already in cart, updating quantity");

            const newQuantity = cart.Products[productIndex].Quantity + quantity;

            if (newQuantity > 10) {
                return res.status(400).json({ success: false, message: "Maximum quantity limit of 10 reached for this product." });
            }

            if (newQuantity > product.stock) {
                return res.status(400).json({ success: false, message: `Cannot add more than ${product.stock} of this product to the cart. Maximum stock reached !` });
            }

            cart.Products[productIndex].Quantity = newQuantity;
        } else {
            if (quantity > product.stock) {
                return res.status(400).json({ success: false, message: `Cannot add more than ${product.stock} of this product to the cart. Maximum stock reached !` });
            }

            cart.Products.push({
                ProductId: product._id,
                Quantity: quantity, // Defaulted to 1
                Price: product.price,
            });
        }

        await cart.save();

        res.status(200).json({ success: true, message: "Product added to cart successfully" });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: "Error adding product to cart" });
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const quantity = req.body.quantity;

        const cart = await Cart.findOne({ UserId: userId }).populate({
            path: "Products.ProductId",
            select: "name stock price", // Select relevant fields
        });

        if (!cart) {
            return res.redirect("/login");
        }

        // Update quantities based on the input
        for (const product of cart.Products) {
            const newQuantity = parseInt(quantity[product.ProductId._id], 10); // Use _id for lookup

            if (newQuantity > product.ProductId.stock) {
                // If requested quantity exceeds available stock, return an error message
                return res.redirect(`/cart?error=Cannot update ${product.ProductId.name}: Requested quantity (${newQuantity}) exceeds available stock (${product.ProductId.stock})`);
            } else if (newQuantity >= 1) {
                product.Quantity = newQuantity; // Update quantity if valid
            }
        }

        await cart.save(); // Save updated cart
        res.redirect(`/cart`);
    } catch (error) {
        console.error("Error from updating cart: \n", error);
        res.redirect(`/cart?error=Something went wrong while updating the cart.`);
    }
};

const delete_item = async (req, res) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        // console.log("Deleting item with ID:", productId);

        const cart = await Cart.findOne({ UserId: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found." });
        }

        cart.Products = cart.Products.filter((item) => item.ProductId.toString() !== productId);

        await cart.save();

        res.status(200).json({ message: "Item removed from cart successfully." });
    } catch (error) {
        console.error("Error deleting item from cart:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userLoggedIn ? true : false;

        const user = await User.findById(userId);

        const addresses = await Address.find({ userId: userId });
        const defaultAddress = addresses.find((address) => address.isDefault);
        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");

        if (!cart || cart.Products.length === 0) {
            const deliveryCharge = 0;
            return res.render("user/checkout", {
                user: userId,
                userId,
                userLoggedIn,
                addresses,
                defaultAddress,
                totalPrice: 0,
                orderItems: [],
                deliveryCharge,
            });
        }

        const orderItems = cart.Products.map((item) => ({
            productName: item.ProductId.name,
            productTotal: item.Price * item.Quantity,
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + item.productTotal, 0);

        const deliveryCharge = subtotal > 1500 ? 0 : 20;
        const totalPrice = subtotal + deliveryCharge;

        res.render("user/checkout", {
            user: userId,
            userId,
            userLoggedIn,
            addresses,
            defaultAddress,
            totalPrice,
            orderItems,
            deliveryCharge, // Pass deliveryCharge here
        });
    } catch (error) {
        console.error("Error from get checkout page : \n ", error);
    }
};

const creatingOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod } = req.body;

        const user = await User.findById(userId);
        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");
        const address = await Address.findById(addressId);

        console.log("addressId : ", addressId);
        console.log("PaymentMethod : ", paymentMethod);

        if (!cart || cart.Products.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }
        if (!address) {
            return res.status(400).json({ message: "Invalid address." });
        }

        // Check stock availability for each product
        const orderItems = [];
        for (const item of cart.Products) {
            const product = item.ProductId;
            const requestedQuantity = item.Quantity;

            // Check if the requested quantity exceeds available stock
            if (requestedQuantity > product.stock) {
                return res.status(400).json({
                    message: `Cannot order ${requestedQuantity} of ${product.name}. Only ${product.stock} available in stock.`,
                });
            }

            orderItems.push({
                productId: product._id,
                quantity: requestedQuantity,
                price: product.price * requestedQuantity,
            });
        }

        const subtotal = orderItems.reduce((sum, item) => sum + (item.price || 0), 0);
        console.log("subtotal : ", subtotal);

        const deliveryCharge = subtotal > 1500 ? 0 : 20;
        const total = subtotal + deliveryCharge;

        if (isNaN(total)) {
            return res.status(500).json({ message: "Failed to calculate total." });
        }

        const order = new Order({
            userId: userId,
            products: orderItems,
            paymentMethod: paymentMethod,
            total: total,
            shippingCost: deliveryCharge,
            Address: address._id,
        });

        await order.save();

        await User.findByIdAndUpdate(userId, { $inc: { orders: 1 } });

        // Decrease stock
        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity },
            });
        }

        req.session.orderPlaced = true;
        cart.Products = [];
        await cart.save();

        res.redirect(`/${userId}/cart/checkout/order-placed/${order._id}`);
    } catch (error) {
        console.error("Error from post place order : \n", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

const getPlaceOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userId ? true : false;
        const orderId = req.params.orderId;

        const user = await User.findById(userId);

        const order = await Order.findById(orderId).populate("products.productId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderItems = order.products.map((item) => ({
            productName: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
        }));

        const orderTotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
        const deliveryCharge = orderTotal > 1500 ? 0 : 20;
        const totalPrice = orderTotal + deliveryCharge;

        res.render("user/orderplaced", {
            userId,
            user,
            orderItems,
            orderTotal,
            totalPrice,
            deliveryCharge,
            orderNumber: order._id,
            userLoggedIn,
            order,
        });
    } catch (error) {
        console.error("Error from get place order : \n", error);
    }
};

module.exports = {
    getCart,
    postAddtoCart,
    updateCart,
    delete_item,
    getCheckout,
    getPlaceOrder,
    creatingOrder,
};
