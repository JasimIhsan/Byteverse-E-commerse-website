const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartSchema = new Schema(
    {
        products: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
                price: { type: Number, require: true },
                quantity: { type: Number, required: true },
                productTotal: { type: Number, required: true },
            },
        ],
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        cartTotal: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Cart", cartSchema);
