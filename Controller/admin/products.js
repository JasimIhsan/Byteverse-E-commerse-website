const Products = require("../../model/product");
const Category = require("../../model/catogory");

// controller for getting product management page - get method
const getProduts = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const prds = await Products.find({ name: { $regex: regex } })
            .populate("category")
            .skip(skip)
            .limit(limit);

        // console.log(prds.category);

        const totalProducts = await Products.countDocuments({ name: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalProducts / limit);

        const error_msg = req.query.error;
        const success_msg = req.query.success;
        res.render("admin/product", { products: prds, search: search, currentPage: Number(page), totalPages, error_msg, success_msg });
    } catch (error) {
        console.error("Error from get products : \n", error);
    }
};

// controller for updating product status (listed or unlisted) - patch method 
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

// controller for getting the product adding page - get method
const getAddProduct = async (req, res) => {
    try {
        const categories = await Category.find();

        const error_msg = req.query.error;
        const success_msg = req.query.success;
        res.render("admin/addproduct", { categories, error_msg, success_msg });
    } catch (error) {
        console.error("Error from get add Product : \n", error);
    }
};

// controller for adding new product to the datatbase - post method
const postAddProduct = async (req, res) => {
    try {
        // const isExist = await Products.findOne({ name: req.body.name });

        // if (isExist) {
        //     return res.redirect("/admin/product-management/add-product?error=Product already exists");
        // }

        const imageName = req.files.map((file) => {
            // console.log(file.filename);

            return file.filename;
        });

        if (imageName.length < 3) {
            return res.redirect("/admin/product-management/add-product?error=Atleast 3 images needed");
        }

        // Create a new product document
        const newProduct = new Products({
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            price: req.body.price,
            stock: req.body.stock,
            specifications: {
                processor: {
                    brand: req.body.specifications.processor.brand,
                    model: req.body.specifications.processor.model,
                    cores: req.body.specifications.processor.cores,
                    speed: req.body.specifications.processor.speed,
                },
                ram: {
                    size: req.body.specifications.ram.size,
                    type: req.body.specifications.ram.type,
                },
                storage: {
                    type: req.body.specifications.storage.type,
                    capacity: req.body.specifications.storage.capacity,
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
                    type: req.body.specifications.battery.type,
                    capacity: req.body.specifications.battery.capacity,
                },
                os: req.body.specifications.os,
                weight: req.body.specifications.weight,
                dimensions: {
                    width: req.body.specifications.dimensions.width,
                    height: req.body.specifications.dimensions.height,
                    depth: req.body.specifications.dimensions.depth,
                },
            },
            warranty: req.body.warranty,
            images: imageName,
            description: req.body.description,
            status: req.body.status || "listed",
        });

        // Save the product to the database
        await newProduct.save();

        // console.log("Document stored successfully");

        // Redirect or respond to the client
        res.redirect("/admin/product-management/add-product?success=Product added successfully");
    } catch (error) {
        console.error(error);
        res.redirect("/admin/product-management/add-product?error=An error occurred while adding the product.");
    }
};

// controller for getting page for editing the existing product - get method
const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Products.findById(productId);

        if (!product) {
            res.redirect("/admin/product-management?error=Product not found");
        }

        const categories = await Category.find();

        // console.log(product);

        res.render("admin/editproduct", { categories, product });
    } catch (error) {
        console.error("Error from Get edit product page : \n", error);
    }
};

// controller for updating the details of the existing product - post method
const postEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        console.log("price : ", req.body.price);

        const existingProduct = await Products.findById(productId);
        if (!existingProduct) {
            return res.redirect("/admin/product-management?error=Product not found");
        }

        let updatedImages = existingProduct.images;

        if (req.body.existingImages && Array.isArray(req.body.existingImages)) {
            updatedImages = req.body.existingImages;
        }

        if (req.files.length > 0) {
            const newImages = req.files.map((file) => file.filename);
            updatedImages = [...newImages, ...updatedImages];
        }

        const updatedProductData = {
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            price: req.body.price,
            stock: req.body.stock,
            specifications: {
                processor: {
                    brand: req.body.specifications?.processor?.brand || "",
                    model: req.body.specifications?.processor?.model || "",
                    cores: req.body.specifications?.processor?.cores || "",
                    speed: req.body.specifications?.processor?.speed || "",
                },
                ram: {
                    size: req.body.specifications?.ram?.size || "",
                    type: req.body.specifications?.ram?.type || "",
                },
                storage: {
                    type: req.body.specifications?.storage?.type || "",
                    capacity: req.body.specifications?.storage?.capacity || "",
                },
                display: {
                    size: req.body.specifications?.display?.size || "",
                    resolution: req.body.specifications?.display?.resolution || "",
                },
                graphics: {
                    brand: req.body.specifications?.graphics?.brand || "",
                    model: req.body.specifications?.graphics?.model || "",
                    memory: req.body.specifications?.graphics?.memory || "",
                },
                battery: {
                    type: req.body.specifications?.battery?.type || "",
                    capacity: req.body.specifications?.battery?.capacity || "",
                },
                os: req.body.specifications?.os || "",
                weight: req.body.specifications?.weight || "",
                dimensions: {
                    width: req.body.specifications?.dimensions?.width || "",
                    height: req.body.specifications?.dimensions?.height || "",
                    depth: req.body.specifications?.dimensions?.depth || "",
                },
            },
            warranty: req.body.warranty || "",
            images: updatedImages,
            description: req.body.description,
            status: req.body.status || "listed",
        };

        const updatedProduct = await Products.findByIdAndUpdate(productId, updatedProductData, { new: true });

        if (!updatedProduct) {
            return res.redirect("/admin/product-management?error=Product not found");
        }

        res.redirect(`/admin/product-management?success=Product updated successfully`);
    } catch (error) {
        console.error("Error updating product: \n", error);
        res.redirect(`/admin/product-management?error=Error updating product`);
    }
};

// controller for getting the product detail page - get method
const getProductDetail = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Products.findById(productId).populate("category");
        if (!product) {
            return res.status(404).send("Product not found");
        }
        res.render("admin/productdetail", { product });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    getProduts,
    updateProductStatus,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    getProductDetail,
};
