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
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Pending",
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["UPI Payment", "Wallet Payments", "Cash on Delivery"],
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
    address: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        additionalInfo: { type: String },
    },
    cancellationReason: {
        type: String,
    },
    couponCode: {
        type: String,
        default: null,
    },
    couponDiscount: {
        type: Number,
        default: 0,
    },
});

orderSchema.pre("save", function (next) {
    if (this.paymentMethod === "Cash on Delivery") {
        this.deliveryStatus = "Processing";
    } else {
        this.deliveryStatus = "Pending";
    }
    next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
