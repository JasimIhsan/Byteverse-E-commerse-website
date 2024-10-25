const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        discountAmount: {
            type: Number,
            required: true,
        },
        offerType: {
            type: String,
            enum: ["product", "category"],
            required: true,
        },
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        minimumPrice: {
            type: Number,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Offer = mongoose.model("Offer", offerSchema);

module.exports = Offer;
