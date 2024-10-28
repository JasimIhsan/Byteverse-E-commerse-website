const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../model/user");
const Product = require("../model/product");
const Category = require("../model/catogory");
const Cart = require("../model/cart");
const Address = require("../model/Address");
const Order = require("../model/orders");
const Coupon = require("../model/coupon");
const Offers = require("../model/offers");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        // const userId = "671779c18dc25b26d1f7d8ea";
        const { addressId, couponCode } = req.body;

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

        const orderItems = cart.products.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productTotal,
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
        const deliveryCharge = subtotal > 1500 ? 0 : 20;
        // let total = subtotal + deliveryCharge;

        let total = 1;

        let couponDiscount = 0;
        if (coupon) {
            couponDiscount = coupon.discount;
            total -= couponDiscount;
        }

        let cartDiscount = cart.cartDiscount > 0 ? cart.cartDiscount : 0;
        total -= cartDiscount;

        if (isNaN(total)) {
            return res.status(500).json({ message: "Failed to calculate total." });
        }

        const options = {
            amount: total * 100,
            currency: "USD",
            receipt: "order_" + new Date().getTime(),
        };

        const razorpayOrder = await razorpay.orders.create(options);
        console.log("razorpayOrder : \n", razorpayOrder);

        const newOrder = new Order({
            userId,
            products: orderItems,
            paymentMethod: "UPI Payment",
            total,
            shippingCost: deliveryCharge,
            paymentStatus: "Pending",
            razorpayOrderId: razorpayOrder.id,
            address,
            couponCode: couponCode || null,
            couponDiscount,
            offerDiscount: cartDiscount,
        });

        await newOrder.save();

        req.session.orderPlaced = true;

        res.status(200).json({ orderId: razorpayOrder.id, user, key: process.env.RAZORPAY_KEY_ID, newOrderId: newOrder._id, userId });
    } catch (error) {
        console.error("Error creating order: \n", error);
        res.status(500).json({ error: "Something went wrong!" });
    }
};

const verifyPayment = async (req, res) => {
    const { order_id, payment_id, razorpay_signature, addressId, couponCode, firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo } = req.body;
    const userId = req.session.userId;
    // const userId = "671779c18dc25b26d1f7d8ea";
    try {
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(order_id + "|" + payment_id)
            .digest("hex");

        if (generatedSignature === razorpay_signature) {
            const order = await Order.findOne({ razorpayOrderId: order_id });
            if (!order) {
                return res.status(404).json({ message: "Order not found." });
            }

            if (order.paymentStatus === "Paid") {
                return res.status(400).json({ message: "Payment has already been verified." });
            }

            order.paymentStatus = "Paid";
            order.paymentId = payment_id;
            order.deliveryStatus = "Processing";
            order.address = {
                firstName,
                lastName,
                phoneNumber,
                street,
                city,
                state,
                postalCode,
                country,
                additionalInfo,
            };

            await order.save();
            console.log("Order saved successfully");

            // for (const item of order.products) {
            //     await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            // }

            // await Cart.findOneAndUpdate({ userId }, { products: [] });

            req.session.orderPlaced = true;

            res.status(200).json({ message: "Payment verified and order saved successfully!", newOrderId: order._id });
        } else {
            res.status(400).json({ message: "Invalid payment signature!" });
        }
    } catch (error) {
        console.error("Error verifying payment: \n", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

const retryPayment = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.session.userId;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({ message: "Payment has already been completed." });
        }

        const options = {
            amount: order.total * 100,
            currency: "USD",
            receipt: "order_" + new Date().getTime(),
        };

        const razorpayOrder = await Razorpay.orders.create(options);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({ orderId: razorpayOrder.id, message: "Retry payment initiated.", newOrderId: order._id });
    } catch (error) {
        console.error("Error during retry payment: \n", error);
        res.status(500).json({ error: "Failed to initiate payment retry." });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    retryPayment,
};
