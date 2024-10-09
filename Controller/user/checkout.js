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

        if (!user) {
            return res.redirect("/login");
        }

        if (!cart || cart.Products.length === 0) {
            return res.render("user/cart", { cartItems: [], subtotal: 0, total: 0, userLoggedIn, user });
        }

        const cartItems = cart.Products.map((item) => ({
            id: item.ProductId._id,
            name: item.ProductId.name,
            price: item.Price,
            quantity: item.Quantity,
            image: item.ProductId.images,
        }));

        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const shippingCost = 10;
        const total = subtotal + shippingCost;

        res.render("user/cart", { cartItems, subtotal, total, userLoggedIn, user });
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
            return res.status(401).json({ message: "User not logged in. Please log in to add items to your cart." });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
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
                return res.status(400).json({ message: "Maximum quantity limit of 10 reached for this product." });
            }

            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Cannot add more than ${product.stock} of this product to the cart.` });
            }

            cart.Products[productIndex].Quantity = newQuantity;
        } else {
            if (quantity > product.stock) {
                return res.status(400).json({ message: `Cannot add more than ${product.stock} of this product to the cart.` });
            }

            cart.Products.push({
                ProductId: product._id,
                Quantity: quantity, // Defaulted to 1
                Price: product.price,
            });
        }

        await cart.save();

        res.status(200).json({ message: "Product added to cart successfully" });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).json({ message: "Error adding product to cart" });
    }
};

const updateCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const quantity = req.body.quantity;

        // console.log(userId);
        // console.log(quantity);

        const cart = await Cart.findOne({ UserId: userId });

        // console.log(cart);

        if (!cart) {
            return res.redirect("/login");
        }

        cart.Products.forEach((product) => {
            if (quantity[product.ProductId]) {
                const newQuantity = parseInt(quantity[product.ProductId], 10);

                if (newQuantity >= 1) {
                    product.Quantity = newQuantity;
                }
            }
        });

        await cart.save();
        res.redirect(`/${userId}/cart`);
    } catch (error) {
        console.error("Error from updating cart : \n ", error);
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
        if (!user) {
            return res.redirect("/login");
        }

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
        if (!user) {
            return res.redirect("/login");
        }

        console.log("addressId : ", addressId);
        console.log("PaymentMethod : ", paymentMethod);

        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");
        const address = await Address.findById(addressId);

        if (!cart || cart.Products.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }
        if (!address) {
            return res.status(400).json({ message: "Invalid address." });
        }

        const orderItems = cart.Products.map((item) => {
            return {
                productId: item.ProductId._id,
                quantity: item.Quantity,
                price: item.Price * item.Quantity,
            };
        });

        // console.log("order items :", orderItems);

        const subtotal = orderItems.reduce((sum, item) => {
            return sum + (item.price || 0);
        }, 0);

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

        req.session.orderPlaced = true;
        // Clear the cart after placing the order
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

        if (!user) {
            return res.redirect("/login");
        }

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
