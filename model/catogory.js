const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ["listed", "unlisted"],
            default: "listed",
        },
        image: {
            type: [String],
        },
    },
    { timestamp: true }
);

module.exports = mongoose.model("Category", categorySchema);
