const Products = require("../../model/product");
const Category = require("../../model/catogory");
const User = require("../../model/user");

const getShop = async (req, res) => {
    try {
        const title = "Shop | Byteverse E-commerce";
        const { search = "", page = 1, sortby = "popularity" } = req.query; // Add 'sortby' to query parameters
        const limit = 12;
        const skip = (page - 1) * limit;

        const userId = req.session.userId;
        const user = await User.findById(userId);

        // Sorting logic based on 'sortby' value
        let sortOptions = {};
        switch (sortby) {
            case "price_low":
                sortOptions = { price: 1 }; // Sort by price: low to high
                break;
            case "price_high":
                sortOptions = { price: -1 }; // Sort by price: high to low
                break;
            case "average_rating":
                sortOptions = { averageRating: -1 }; // Sort by average rating, ensure this field exists
                break;
            case "a_to_z":
                sortOptions = { name: 1 }; // Sort alphabetically: A-Z
                break;
            case "z_to_a":
                sortOptions = { name: -1 }; // Sort alphabetically: Z-A
                break;
            default:
                sortOptions = { updatedAt: -1 }; // Default sort by popularity (latest products)
        }

        const products = await Products.find({ status: "listed", name: { $regex: search, $options: "i" } })
            .sort(sortOptions) // Apply sorting
            .populate({ path: "category", match: { status: "listed" } })
            .skip(skip)
            .limit(limit);

        const filteredProducts = products.filter((product) => product.category);

        const totalProducts = await Products.countDocuments({
            name: { $regex: search, $options: "i" },
            status: "listed",
        });

        const totalPages = Math.ceil(totalProducts / limit);
        const userLoggedIn = req.session.user ? true : false;

        const categories = await Category.find({ status: "listed" });

        const categoriesWithCounts = await Promise.all(
            categories.map(async (category) => {
                const count = await Products.countDocuments({ category: category._id, status: "listed" });
                return { ...category.toObject(), productCount: count }; // Include the count in the returned object
            })
        );

        res.render("user/shop", {
            userLoggedIn,
            user,
            products: filteredProducts,
            currentPage: Number(page),
            totalPages,
            title,
            categories,
            categoriesWithCounts,
            sortby, // Pass the sortby value back to the view to retain the selected option
        });
    } catch (error) {
        console.error("Error from get shop: \n", error);
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

        const userId = req.session.userId;
        const user = await User.findById(userId);

        const userLoggedIn = req.session.user ? true : false;

        let errorMessage = null;
        // Check if the product is found
        if (!product) {
            return res.render("user/product-detail", {
                userLoggedIn,
                product: null,
                relatedProducts: [],
                title,
                user,
                errorMessage: "Product not found.",
            });
        }

        // Check if the category exists and is listed
        if (!product.category) {
            return res.render("user/product-detail", {
                userLoggedIn,
                product,
                relatedProducts: [],
                title,
                user,
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
            userLoggedIn,
            product,
            relatedProducts,
            title,
            user,
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
