const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    orderDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    deliveryStatus: {
        type: String,
        required: true,
        enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Credit Card", "PayPal", "Bank Transfer", "Cash on Delivery"],
    },
    total: {
        type: Number,
        required: true,
    },
    orderTime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    shippingCost: {
        type: Number,
        default: 0,
    },
    Address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
    },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
