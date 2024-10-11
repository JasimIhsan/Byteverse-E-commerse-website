const Products = require("../../model/product");
const Category = require("../../model/catogory");
const User = require("../../model/user");

const getShop = async (req, res) => {
    try {
        const title = "Shop | Byteverse E-commerce";
        const { search = "", page = 1, sortby = "popularity", categories = [], brands = [] } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");
        const userId = req.session.userId;

        const user = await User.findById(userId);
      

        let sortOptions = {};
        switch (sortby) {
            case "price_low":
                sortOptions = { price: 1 };
                break;
            case "price_high":
                sortOptions = { price: -1 };
                break;
            case "average_rating":
                sortOptions = { averageRating: -1 };
                break;
            case "a_to_z":
                sortOptions = { name: 1 };
                break;
            case "z_to_a":
                sortOptions = { name: -1 };
                break;
            default:
                sortOptions = { updatedAt: -1 };
        }

        // Ensure categories and brands are always treated as arrays
        const selectedCategories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
        const selectedBrands = Array.isArray(brands) ? brands : [brands].filter(Boolean);

        let query = { status: "listed", name: { $regex: regex } };

        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        if (selectedBrands.length > 0) {
            query.brand = { $in: selectedBrands };
        }

        const products = await Products.find(query)
            .sort(sortOptions)
            .populate({ path: "category", match: { status: "listed" } })
            .skip(skip)
            .limit(limit);

        const filteredProducts = products.filter((product) => product.category);

        const totalProducts = await Products.countDocuments(query);

        const totalPages = Math.ceil(totalProducts / limit);
        const userLoggedIn = req.session.user ? true : false;

        const categoriesList = await Category.find({ status: "listed" });

        const categoriesWithCounts = await Promise.all(
            categoriesList.map(async (category) => {
                const count = await Products.countDocuments({ category: category._id, status: "listed" });
                return { ...category.toObject(), productCount: count };
            })
        );

        res.render("user/shop", {
            userLoggedIn,
            user,
            search,
            products: filteredProducts,
            currentPage: Number(page),
            totalPages,
            title,
            categories: categoriesList,
            categoriesWithCounts,
            sortby,
            selectedCategories,
            selectedBrands,
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
