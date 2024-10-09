const User = require("../../model/user");
const Product = require("../../model/product");
const Category = require("../../model/catogory");
const Cart = require("../../model/cart");
const user = require("../../model/user");
const Address = require("../../model/Address");

const getCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userId ? true : false;
        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");
        const user = await User.findById(userId);

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

        const addresses = await Address.find({ userId: userId });
        const defaultAddress = addresses.find((address) => address.isDefault);

        const cart = await Cart.findOne({ UserId: userId }).populate("Products.ProductId");

        if (!cart || cart.Products.length === 0) {
            return res.render("user/checkout", { userId, userLoggedIn, addresses, defaultAddress, totalPrice: 0, orderItems: [] });
        }
        const orderItems = cart.Products.map((item) => ({
            productName: item.ProductId.name,
            productTotal: item.Price * item.Quantity,
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + item.productTotal, 0);

        const deliveryCharge = 10;

        const totalPrice = subtotal + deliveryCharge;

        res.render("user/checkout", { userId, userLoggedIn, addresses, defaultAddress, totalPrice, orderItems, deliveryCharge });
    } catch (error) {
        console.error("Error from get checkout page : \n ", error);
    }
};

module.exports = {
    getCart,
    postAddtoCart,
    updateCart,
    delete_item,
    getCheckout,
};
