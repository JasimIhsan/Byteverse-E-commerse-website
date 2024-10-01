const Products = require("../../model/product");
const Category = require("../../model/catogory");

const getProduts = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const prds = await Products.find({ name: { $regex: regex } })
            .sort({ joinedAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalProducts = await Products.countDocuments({ name: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalProducts / limit);

        const addCatmsg = req.query.error;
        res.render("admin/product", { products: prds, search: search, currentPage: Number(page), totalPages, addCatmsg });
    } catch (error) {
        console.error("Error from get products : \n", error);
    }
};

const updateProductStatus = async (req, res) => {
    try {
        const productId = req.params.id;
        const newStatus = req.body.status;

        await Products.findByIdAndUpdate(productId, { status: newStatus }, { new: true });

        res.json({ success: true });
    } catch (error) {
        console.error("Error from Catogory status update : \n", error);
    }
};

const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find();
        res.render("admin/addproduct", { categories });
    } catch (error) {
        console.error("Error from get add Product : \n", error);
    }
};

const postAddProduct = async (req, res) => {
    try {
        // Create an array of file paths for the uploaded images
        const imagePaths = req.files.map((file) => file.path);

        // console.log(req.body);

        const newProduct = new Products({
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            price: req.body.price,
            specifications: {
                processor: {
                    brand: req.body.specifications.processor.brand,
                    model: req.body.specifications.processor.model,
                    cores: req.body.specifications.processor.cores,
                    speed: req.body.specifications.processor.speed,
                },
                ram: {
                    size: req.body.specifications.ram.size, // Ensure size is a string
                    type: req.body.specifications.ram.type, // Ensure type is a string
                },
                storage: {
                    type: req.body.specifications.storage.type, // Ensure type is a string
                    capacity: req.body.specifications.storage.capacity, // Ensure capacity is a string
                },
                display: {
                    size: req.body.specifications.display.size,
                    resolution: req.body.specifications.display.resolution,
                },
                graphics: {
                    brand: req.body.specifications.graphics.brand,
                    model: req.body.specifications.graphics.model,
                    memory: req.body.specifications.graphics.memory,
                },
                battery: {
                    type: req.body.specifications.battery.type, // Ensure type is a string
                    capacity: req.body.specifications.battery.capacity, // Ensure capacity is a string
                },
                os: req.body.specifications.os,
                weight: req.body.specifications.weight,
                dimensions: {
                    width: req.body.specifications.dimensions.width,
                    height: req.body.specifications.dimensions.height,
                    depth: req.body.specifications.dimensions.depth,
                },
            },
            images: imagePaths,
        });

        await newProduct.save();

        // alert("Are you sure you want to create a product ?");
        res.redirect("/admin/product-management");
    } catch (error) {
        console.error("Error from post add product : \n", error);
    }
};

module.exports = {
    getProduts,
    updateProductStatus,
    getAddProduct,
    postAddProduct,
};
