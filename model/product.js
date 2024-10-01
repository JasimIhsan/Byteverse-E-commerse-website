const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    specifications: {
        processor: {
            brand: { type: String, required: true },
            model: { type: String, required: true },
            cores: { type: Number, required: true },
            speed: { type: String, required: true },
        },
        ram: {
            size: { type: String, required: true },
            type: { type: String, required: true },
        },
        storage: {
            type: { type: String, required: true },
            capacity: { type: String, required: true },
            display: {
                size: { type: String, required: true },
                resolution: { type: String, required: true },
            },
            graphics: {
                brand: { type: String, required: true },
                model: { type: String, required: true },
                memory: { type: String, required: true },
            },
            battery: {
                type: { type: String, required: true },
                capacity: { type: String, required: true },
            },
            os: { type: String, required: true },
            weight: { type: String, required: true },
            dimensions: {
                width: { type: Number, required: true },
                height: { type: Number, required: true },
                depth: { type: Number, required: true },
            },
        },
        images: [String],
    },
});

const Product = mongoose.model("Products", productSchema);

module.exports = Product;
