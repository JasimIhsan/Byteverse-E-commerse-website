const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
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
                itemDeliveryStatus: {
                    type: String,
                    enum: ["Cancelled"],
                },
                itemCancelledAt: {
                    type: Date,
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
            enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
            default: "Pending",
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["UPI Payment", "Wallet Payments", "Cash on Delivery"],
        },
        paymentStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
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
        returnReason: {
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
        offerDiscount: {
            type: Number,
            default: 0,
        },
        paymentId: {
            type: String,
            default: null,
        },
        razorpayOrderId: {
            type: String,
            default: null,
        },
        transactionDate: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
