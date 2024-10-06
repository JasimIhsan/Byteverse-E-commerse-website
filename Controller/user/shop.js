const Products = require("../../model/product");
const Category = require("../../model/catogory");

const getShop = async (req, res) => {
    try {
        const title = "Shope | Byteverse E-commerce";
        const { search = "", page = 1 } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;

        const products = await Products.find({ status: "listed" })
            .sort({ updatedAt: -1 })
            .populate({ path: "category", match: { status: "listed" } })
            .skip(skip)
            .limit(limit);

        const filteredProducts = products.filter((product) => product.category);

        const totalProducts = await Products.countDocuments({ name: { $regex: search, $options: "i" }, status: "listed" }).populate({ path: "category", match: { status: "listed" } });

        const totalPages = Math.ceil(totalProducts / limit);
        const userLoggedIn = req.session.user ? true : false;

        const categories = await Category.find({ status: "listed" });

        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const count = await Products.countDocuments({ category: category._id, status: "listed" });
                return { ...category.toObject(), productCount: count }; // Include the count in the returned object
            })
        );

        res.render("user/shop", { user: userLoggedIn, products: filteredProducts, currentPage: Number(page), totalPages, title, categories, categoriesWithCounts });
    } catch (error) {
        console.error("Error from get shop  :  \n", error);
    }
};

const getProductDetail = async (req, res) => {
    try {
        const title = "Product detail page | Byteverse E-commerce";
        const productId = req.params.productId;

        const product = await Products.findOne({ _id: productId }).populate({
            path: "category",
            match: { status: "listed" },
        });

        let errorMessage = null;
        // Check if the product is found
        if (!product) {
            return res.render("user/product-detail", {
                user: req.session.user ? true : false,
                product: null,
                relatedProducts: [],
                title,
                errorMessage: "Product not found.",
            });
        }

        // Check if the category exists and is listed
        if (!product.category) {
            return res.render("user/product-detail", {
                user: req.session.user ? true : false,
                product,
                relatedProducts: [],
                title,
                errorMessage: "Product category is not listed.",
            });
        }

        // Fetch related products only if category is valid
        const relatedProducts = await Products.find({
            category: product.category._id,
            _id: { $ne: productId },
            status: "listed",
        }).limit(4);

        res.render("user/product-detail.ejs", {
            user: req.session.user ? true : false,
            product,
            relatedProducts,
            title,
            errorMessage,
        });
    } catch (error) {
        console.error("Error from get product detail page : \n", error);
    }
};

module.exports = {
    getShop,
    getProductDetail,
};
