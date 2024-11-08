// these controller are especially for razorpay pay payment method or online payment method

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
const Wallet = require("../model/wallet");

function generateOrderId() {
    const prefix = "ORD";
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp.toString().slice(-3)}${randomNum}`;
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// controller for creating order with pending status - post method
const createOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, couponCode, firstName, lastName, phoneNumber, street, city, state, postalCode, country, additionalInfo } = req.body;

        const [user, cart, coupon] = await Promise.all([
            User.findById(userId),
            Cart.findOne({ userId: userId }).populate("products.productId"),
            Coupon.findOne({
                code: couponCode,
                isActive: true,
                expiryDate: { $gte: new Date() },
            }),
        ]);

        if (!cart || cart.products.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }

        const orderItems = cart.products.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price: item.productTotal,
        }));

        const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
        const deliveryCharge = subtotal > 1500 ? 0 : 20;
        let total = subtotal + deliveryCharge;

        // let total = 1;

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
            currency: "INR",
            receipt: "order_" + new Date().getTime(),
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const orderId = await generateOrderId();

        const newOrder = new Order({
            userId,
            orderId,
            products: orderItems,
            paymentMethod: "UPI Payment",
            total,
            shippingCost: deliveryCharge,
            paymentStatus: "Pending",
            razorpayOrderId: razorpayOrder.id,
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
            couponCode: couponCode || null,
            couponDiscount,
            offerDiscount: cartDiscount,
        });

        await newOrder.save();

        await Cart.findOneAndUpdate({ userId }, { products: [] });

        req.session.orderPlaced = true;

        res.status(200).json({ orderId: razorpayOrder.id, user, key: process.env.RAZORPAY_KEY_ID, newOrderId: newOrder._id, userId });
    } catch (error) {
        console.error("Error creating order: \n", error);
        res.status(500).json({ error: "Something went wrong!" });
    }
};

// controller for varifiying the payment is successfully done and saving the status as paid and processing - post method
const verifyPayment = async (req, res) => {
    const { order_id, payment_id, razorpay_signature } = req.body;
    const userId = req.session.userId;
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

            await order.save();
            console.log("Order saved successfully");

            for (const item of order.products) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }

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

// controller for payment failure store status as pending (can retry from order history page) - post method
const paymentFailure = async (req, res) => {
    const { order_id, paymentStatus, deliveryStatus } = req.body;

    try {
        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        order.paymentStatus = paymentStatus;
        order.deliveryStatus = deliveryStatus;
        await order.save();

        res.status(200).json({ message: "Order status updated to failed." });
    } catch (error) {
        console.error("Error updating failed order:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// controller for retry payment from order history page - post method
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

        console.log("Order total : ", order.total);

        const options = {
            amount: order.total * 100,
            currency: "INR",
            receipt: "order_" + new Date().getTime(),
        };

        const razorpayOrder = await razorpay.orders.create(options);
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({ orderId: razorpayOrder.id, message: "Retry payment initiated.", newOrderId: order._id, total: order.total });
    } catch (error) {
        console.error("Error during retry payment: \n", error);
        res.status(500).json({ error: "Failed to initiate payment retry." });
    }
};

// controller for adding money to the wallet - post method
const walletAddMoney = async (req, res) => {
    const { amount } = req.body;
    // const amount = 1;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount." });
    }

    try {
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `wallet_add_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            orderId: order.id,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Failed to create order." });
    }
};

// controller for varifying the transaction succeessfully done - post method
const walletVerifyPayment = async (req, res) => {
    const { paymentId, orderId, amount, payment_signature } = req.body;

    try {
        const crypto = require("crypto");
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest("hex");

        if (generatedSignature !== payment_signature) {
            return res.status(400).json({ message: "Invalid signature." });
        }

        const userId = req.session.userId;
        // const userId = "671779c18dc25b26d1f7d8ea";

        const transactionId = `wal_id_${Date.now()}`;
        const transaction = {
            transactionId,
            type: "Credit",
            amount,
            description: "Added money to wallet through razorpay",
            status: "completed",
            date: new Date(),
        };

        await Wallet.findOneAndUpdate(
            { userId },
            {
                $inc: { balance: amount },
                $push: { transactions: transaction },
            },
            { new: true }
        );

        res.status(200).json({ message: "Payment verified successfully." });
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    paymentFailure,
    retryPayment,
    walletAddMoney,
    walletVerifyPayment,
};
