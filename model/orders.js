const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    productId: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
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
    total: {
        type: Number,
        required: true,
    },
    orderTime: {
        type: Date,
        required: true,
        default: Date.now,
    },
    Address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: true,
    },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
