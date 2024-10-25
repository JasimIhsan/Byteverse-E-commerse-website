// In your payment route file
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID, // add your key id here
    key_secret: process.env.RAZORPAY_KEY_SECRET, // add your key secret here
});

// Create payment order
const createOrder = async (req, res) => {
    const { amount } = req.body; // receive amount in smallest currency unit, e.g., 50000 paise = 500 INR

    const options = {
        amount: amount,
        currency: "INR",
        receipt: "order_" + new Date().getTime(),
    };

    try {
        const order = await razorpay.orders.create(options);
        res.status(200).json({ orderId: order.id });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong!" });
    }
};
