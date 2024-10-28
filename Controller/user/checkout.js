const User = require("../../model/user");
const Product = require("../../model/product");
const Category = require("../../model/catogory");
const Cart = require("../../model/cart");
const Address = require("../../model/Address");
const Order = require("../../model/orders");
const Coupon = require("../../model/coupon");
const Offers = require("../../model/offers");

//--------------- Find best Offer --------------------//

function findBestOffer(product, offers) {
    let bestOffer = null;
    const currentDate = new Date();

    const productOffers = offers.filter((offer) => offer.applicableProducts.includes(product._id) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const categoryOffers = offers.filter((offer) => offer.applicableCategories.includes(product.category) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const allOffers = [...productOffers, ...categoryOffers];

    if (allOffers.length > 0) {
        bestOffer = allOffers.reduce((best, current) => {
            return current.discountAmount > best.discountAmount ? current : best;
        });
    }

    return bestOffer;
}

//--------------- cart --------------------//

const getCart = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userId ? true : false;

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const cart = await Cart.findOne({ userId: userId }).populate({
            path: "products.productId",
            select: "name price category stock images",
        });
        const user = await User.findById(userId);

        req.session.orderPlaced = false;

        if (!cart || cart.products.length === 0) {
            const error = req.query.error || null;
            const success = req.query.success || null;
            return res.render("user/cart", {
                cartItems: [],
                subtotal: 0,
                total: 0,
                cartTotal: 0,
                userLoggedIn,
                user,
                error_msg: error,
                success_msg: success,
            });
        }

        const offers = await Offers.find({ isActive: true });

        const cartItems = cart.products.map((item) => {
            const bestOffer = findBestOffer(item.productId, offers);

            let finalPrice = item.productId.price;

            if (bestOffer) {
                finalPrice = item.productId.price - bestOffer.discountAmount;
            }

            return {
                id: item.productId._id,
                name: item.productId.name,
                price: item.productId.price,
                quantity: item.quantity,
                stock: item.productId.stock,
                image: item.productId.images,
                bestOffer,
                finalPrice,
                productTotal: finalPrice * item.quantity,
            };
        });

        const subtotal = cartItems.reduce((acc, item) => acc + item.productTotal, 0);

        const shippingCost = subtotal > 1500 ? 0 : 20;

        const cartTotal = subtotal + shippingCost;

        res.render("user/cart", {
            cart,
            cartItems,
            subtotal: subtotal,
            cartTotal: cartTotal,
            shippingCost: shippingCost,
            userLoggedIn,
            user,
        });
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
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in. Please log in to add items to your cart." });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const offers = await Offers.find({ isActive: true });
        const bestOffer = findBestOffer(product, offers);

        let cart = await Cart.findOne({ userId: userId });

        if (!cart) {
            cart = new Cart({ userId: userId, products: [], cartTotal: 0 });
        }

        const productIndex = cart.products.findIndex((item) => item.productId.toString() === productId);

        if (productIndex > -1) {
            return res.status(200).json({
                success: false,
                exists: true,
                message: "Product already exists in the cart",
            });
        } else {
            const priceAfterDiscount = bestOffer ? product.price - bestOffer.discountAmount : product.price;
            const offerDiscount = bestOffer ? bestOffer.discountAmount : null;

            cart.products.push({
                productId: product._id,
                price: priceAfterDiscount,
                quantity: quantity,
                productTotal: bestOffer ? product.price - bestOffer.discountAmount : product.price,
                offerDiscount: offerDiscount,
            });

            cart.cartDiscount = cart.products.reduce((sum, item) => sum + (item.offerDiscount || 0), 0);
            const cartTotal = cart.products.reduce((acc, curr) => acc + curr.productTotal, 0);
            const totalWithShipping = cartTotal + (cartTotal > 1500 ? 0 : 20);
            cart.cartTotal = totalWithShipping;
        }

        await cart.save();
        return res.status(200).json({ success: true, message: "Product added to cart successfully" });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        return res.status(500).json({ success: false, message: "Error adding product to cart" });
    }
};

const updateCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        // console.log("update productId : ", productId);

        const userId = req.session.userId;
        // const userId = "671779c18dc25b26d1f7d8ea";

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
        }

        const cart = await Cart.findOne({ userId: userId }).populate({
            path: "products.productId",
            select: "name price category stock images",
        });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const item = cart.products.find((i) => i.productId._id.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }

        const offers = await Offers.find({ isActive: true });

        const bestOffer = findBestOffer(item.productId, offers);

        if (quantity > item.productId.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${item.productId.stock} units available in stock.`,
            });
        }

        item.quantity = quantity;
        item.offerDiscount = bestOffer ? bestOffer.discountAmount * quantity : null;
        item.productTotal = bestOffer ? (item.productId.price - bestOffer.discountAmount) * quantity : item.productId.price * quantity;
        item.price = bestOffer ? item.productId.price - bestOffer.discountAmount : item.productId.price;

        const cartTotal = cart.products.reduce((acc, curr) => acc + curr.productTotal, 0);
        const shippingCost = cartTotal > 1500 ? 0 : 20;
        const totalWithShipping = cartTotal + shippingCost;
        const cartDiscount = cart.products.reduce((sum, i) => sum + (i.offerDiscount || 0), 0);

        cart.cartTotal = totalWithShipping;
        cart.cartDiscount = cartDiscount;
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully.",
            updatedProduct: {
                productId: item.productId._id,
                name: item.productId.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.productTotal.toFixed(2),
            },
            subtotal: cartTotal.toFixed(2),
            cartTotal: totalWithShipping.toFixed(2),
            shippingCost: shippingCost.toFixed(2),
        });
    } catch (error) {
        console.error("Error updating cart:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error." });
    }
};

const delete_item = async (req, res) => {
    const { productId } = req.params;
    const userId = req.session.userId;

    try {
        const cart = await Cart.findOne({ userId: userId }).populate({
            path: "products.productId",
            select: "price",
        });
        const offers = await Offers.find({ isActive: true });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        cart.products = cart.products.filter((item) => item.productId._id.toString() !== productId);

        let cartTotal = 0;
        let cartDiscount = 0;

        cart.products.forEach((item) => {
            const bestOffer = findBestOffer(item.productId, offers);
            const offerDiscount = bestOffer ? bestOffer.discountAmount : 0;

            item.productTotal = (item.productId.price - offerDiscount) * item.quantity;
            item.offerDiscount = offerDiscount * item.quantity;

            cartTotal += item.productTotal;
            cartDiscount += offerDiscount * item.quantity;
        });

        let totalWithShipping = cartTotal + (cartTotal > 1500 ? 0 : 20);

        cart.cartTotal = totalWithShipping;
        cart.cartDiscount = cartDiscount;

        await cart.save();

        const updatedProducts = cart.products.map((item) => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            subtotal: item.productTotal.toFixed(2),
        }));

        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully.",
            updatedProducts: updatedProducts,
            subtotal: cartTotal.toFixed(2),
            cartTotal: totalWithShipping.toFixed(2),
        });
    } catch (error) {
        console.error("Error deleting item from cart:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

//--------------- Checkout --------------------//

const getCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = req.session.userLoggedIn ? true : false;

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const user = await User.findById(userId);
        const addresses = await Address.find({ userId: userId });
        const defaultAddress = addresses.find((address) => address.isDefault);
        const cart = await Cart.findOne({ userId: userId }).populate("products.productId");

        const today = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gte: today },
            usedBy: { $ne: userId },
        });

        if (!cart || cart.products.length === 0) {
            let deliveryCharge = 0;
            return res.render("user/checkout", {
                user: userId,
                userId,
                userLoggedIn,
                addresses,
                defaultAddress,
                totalPrice: 0,
                orderItems: [],
                deliveryCharge,
                coupons,
            });
        }

        const orderDetails = cart.products.map((item) => ({
            productName: item.productId.name,
            productTotal: item.productTotal,
            quantity: item.quantity,
            cartTotal: cart.cartTotal,
        }));

        let deliveryCharge = 20;
        // console.log(orderDetails);

        req.session.orderPlaced = false;

        res.render("user/checkout", {
            user: userId,
            userId,
            cartTotal: cart.cartTotal,
            userLoggedIn,
            addresses,
            defaultAddress,
            orderDetails,
            deliveryCharge,
            coupons,
        });
    } catch (error) {
        console.error("Error from get checkout page: \n", error);
    }
};

const applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.userId;

    try {
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid coupon code." });
        }

        if (!coupon.isActive) {
            return res.json({ success: false, message: "This coupon is no longer active." });
        }

        if (coupon.expiryDate < new Date()) {
            return res.json({ success: false, message: "This coupon has expired." });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.json({ success: false, message: "This coupon has reached its usage limit." });
        }

        const user = await User.findById(userId);

        if (user.usedCoupons.includes(coupon._id)) {
            return res.json({ success: false, message: "You already used this coupon" });
        }

        const userCart = await Cart.findOne({ userId: userId });

        if (!userCart) {
            return res.json({ success: false, message: "Your cart is empty." });
        }

        const total = userCart.cartTotal;

        if (total < coupon.minimumSpend) {
            return res.json({ success: false, message: `Minimum spend of $${coupon.minimumSpend} is required to use this coupon.` });
        }

        const discountAmount = coupon.discount;
        const newTotal = total - discountAmount;

        return res.json({ success: true, discountAmount, newTotal, total });
    } catch (error) {
        console.error("Error applying coupon:", error);
        return res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
    }
};

const creatingOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, paymentMethod, couponCode, firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo } = req.body;
        console.log(req.body);

        const [user, cart, address, coupon] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId: userId }).populate("products.productId"),
            Address.findById(addressId),
            Coupon.findOne({
                code: couponCode,
                isActive: true,
                expiryDate: { $gte: new Date() },
            }),
        ]);

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }
        if (!address) {
            return res.status(400).json({ message: "Invalid address." });
        }

        const orderItems = [];

        for (const item of cart.products) {
            const product = item.productId;
            const requestedquantity = item.quantity;

            if (product.stock == 0) {
                return res.status(400).json({
                    message: `Cannot order ${product.name}. The product is out of stock`,
                });
            }

            if (requestedquantity > product.stock) {
                return res.status(400).json({
                    message: `Cannot order ${requestedquantity} of ${product.name}. Only ${product.stock} available.`,
                });
            }

            orderItems.push({
                productId: product._id,
                quantity: requestedquantity,
                price: item.productTotal,
            });
        }

        const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
        const deliveryCharge = subtotal > 1500 ? 0 : 20;
        let total = subtotal + deliveryCharge;
        let couponDiscount = 0;

        if (coupon) {
            couponDiscount = coupon.discount;
            total -= couponDiscount;
        }

        let cartDiscount = 0;
        if (cart.cartDiscount > 0) {
            cartDiscount = cart.cartDiscount;
        }

        if (isNaN(total)) {
            return res.status(500).json({ message: "Failed to calculate total." });
        }

        const order = new Order({
            userId,
            products: orderItems,
            paymentMethod,
            total,
            shippingCost: deliveryCharge,
            address: {
                firstName,
                lastName,
                phoneNumber,
                street,
                city,
                state,
                postalCode,
                country,
                additionalInfo,
            },
            couponCode: couponCode ? couponCode : null,
            couponDiscount,
            offerDiscount: cartDiscount,
        });

        await order.save();

        if (coupon) {
            coupon.usedCount += 1;
            await coupon.save();
        }

        await User.findByIdAndUpdate(userId, { $inc: { orders: 1 } });

        for (const item of orderItems) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        cart.products = [];
        await cart.save();

        req.session.orderPlaced = true;

        res.status(200).json({
            message: "Order placed successfully.",
            orderDetails: {
                orderId: order._id,
                userId: order.userId,
                paymentMethod: order.paymentMethod,
                products: order.products,
                total: order.total,
                couponDiscount: order.couponDiscount,
                offerDiscount: order.offerDiscount,
                shippingCost: order.shippingCost,
                address: order.address,
            },
        });
    } catch (error) {
        console.error("Error from post place order: \n", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

//--------------- order confirmaiton --------------------//

const getPlaceOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const userLoggedIn = Boolean(req.session.userLoggedIn);
        const orderId = req.params.orderId;
        console.log("ORDERID : ", orderId);

        // const userId = "671779c18dc25b26d1f7d8ea";
        // const userLoggedIn = true;

        const [user, order, cart] = await Promise.all([User.findById(userId), Order.findById(orderId).populate("products.productId"), Cart.findOne({ userId: userId })]);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const orderItems = order.products.map((item) => ({
            productName: item.productId.name,
            quantity: item.quantity,
            price: item.price,
        }));

        const orderTotal = cart.cartTotal;
        // const deliveryCharge = 20;
        const couponDiscount = order.couponDiscount || 0;
        const totalPrice = orderTotal - couponDiscount;

        console.log("orderTotal : ", orderTotal);

        console.log("totalPriice : ", totalPrice);

        res.render("user/orderplaced", {
            userId,
            user,
            orderItems,
            subtotal: orderTotal,
            totalPrice,
            // deliveryCharge,
            orderNumber: order._id,
            userLoggedIn,
            order,
            couponCode: order.couponCode || null,
            couponDiscount,
        });
    } catch (error) {
        console.error("Error from get place order: \n", error);
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
    applyCoupon,
};
