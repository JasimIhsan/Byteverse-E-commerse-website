const Products = require("../../model/product");
const Category = require("../../model/catogory");

const getProduts = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const prds = await Products.find({ name: { $regex: regex } })
            .populate("category")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log(prds.category);

        const totalProducts = await Products.countDocuments({ name: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalProducts / limit);

        const error_msg = req.query.error;
        const success_msg = req.query.success;
        res.render("admin/product", { products: prds, search: search, currentPage: Number(page), totalPages, error_msg, success_msg });
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
        res.json({ success: false });
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
        console.log("Entered ");

        // Extracting images from the request
        const images = req.files.map((file, index) => {
            return {
                imagePath: file.path, // Assuming you want to store the file path
                isPrimary: req.body.primary_image == index, // Set primary based on radio button selection
            };
        });

        // Determine which image is the primary
        const primaryImageIndex = req.body.primary_image; // Index of the primary image
        if (primaryImageIndex !== undefined) {
            images[primaryImageIndex].isPrimary = true; // Set the selected primary image
        }

        // Create a new product document
        const newProduct = new Product({
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            price: req.body.price,
            stock: req.body.stock,
            specifications: {
                processor: {
                    brand: req.body["specifications[processor][brand]"],
                    model: req.body["specifications[processor][model]"],
                    cores: req.body["specifications[processor][cores]"],
                    speed: req.body["specifications[processor][speed]"],
                },
                ram: {
                    size: req.body["specifications[ram][size]"],
                    type: req.body["specifications[ram][type]"],
                },
                storage: {
                    type: req.body["specifications[storage][type]"],
                    capacity: req.body["specifications[storage][capacity]"],
                },
                display: {
                    size: req.body["specifications[display][size]"],
                    resolution: req.body["specifications[display][resolution]"],
                },
                graphics: {
                    brand: req.body["specifications[graphics][brand]"],
                    model: req.body["specifications[graphics][model]"],
                    memory: req.body["specifications[graphics][memory]"],
                },
                battery: {
                    type: req.body["specifications[battery][type]"],
                    capacity: req.body["specifications[battery][capacity]"],
                },
                os: req.body["specifications[os]"],
                weight: req.body["specifications[weight]"],
                dimensions: {
                    width: req.body["specifications[dimensions][width]"],
                    height: req.body["specifications[dimensions][height]"],
                    depth: req.body["specifications[dimensions][depth]"],
                },
            },
            warranty: req.body.warranty,
            images: images,
            status: req.body.status || "listed", // Default to "listed" if not specified
        });

        // Save the product to the database
        await newProduct.save();

        // Redirect or respond to the client
        res.redirect("/admin/product-management");
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while adding the product.");
    }
};

const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Products.findById(productId);

        if (!product) {
            res.redirect("/admin/product-management?error=Product not found");
        }

        const categories = await Category.find();

        res.render("admin/editproduct", { categories, product });
    } catch (error) {
        console.error("Error from Get edit product page : \n", error);
    }
};

const postEditProduct = async (req, res) => {
    try {
        const { name, brand, category, price, stock, specifications, warranty } = req.body;
        const productId = req.params.id;

        const updatedProduct = await Products.findByIdAndUpdate(productId, { name, brand, category, price, stock, specifications, warranty }, { new: true, runValidators: true });

        if (!updatedProduct) {
            return res.redirect("/admin/product-management?error=Product not found");
        }

        res.redirect("/admin/product-management?success=Product edited successfully");
    } catch (error) {
        console.error("Error from post edit product : \n", error);
    }
};

module.exports = {
    getProduts,
    updateProductStatus,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
};
