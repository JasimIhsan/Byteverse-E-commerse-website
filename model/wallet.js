const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
        },
        transactions: [
            {
                transactionId: {
                    type: String,
                    required: true,
                    unique: true,
                },
                type: {
                    type: String,
                    enum: ["credit", "debit"],
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                description: {
                    type: String,
                },
                status: {
                    type: String,
                    enum: ["pending", "completed", "failed"],
                    required: true,
                    default: "completed",
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
