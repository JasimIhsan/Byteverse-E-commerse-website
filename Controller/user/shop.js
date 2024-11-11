const Products = require("../../model/product");
const Category = require("../../model/catogory");
const User = require("../../model/user");
const Offers = require("../../model/offers");

// function for finding best offer for each product
function findBestOffer(product, offers) {
    let bestOffer = null;
    const currentDate = new Date();

    const productOffers = offers.filter((offer) => offer.applicableProducts.includes(product._id) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const categoryOffers = offers.filter((offer) => offer.applicableCategories.includes(product.category) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const allOffers = [...productOffers, ...categoryOffers];

    if (allOffers.length > 0) {
        bestOffer = allOffers.reduce((best, current) => {
            return current.discountAmount > best.discountAmount ? current : best;
        });
    }

    return bestOffer;
}

// controller for getting all products with best offer in shop page - get method
const getShop = async (req, res) => {
    try {
        const title = "Shop | Byteverse E-commerce";
        const { search = "", page = 1, sortby = "popularity", categories = [], brands = [] } = req.query;
        const limit = 8;
        const skip = (page - 1) * limit;
        const userId = req.session.userId;

        const keywords = search.split(" ").filter(Boolean);

        function createDynamicRegex(keywords) {
            const escapedKeywords = keywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            const pattern = escapedKeywords.map((keyword) => `(?=.*\\b${keyword}\\b)`).join("");
            return new RegExp(pattern, "i");
        }

        const regex = createDynamicRegex(keywords);

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

        const selectedCategories = Array.isArray(categories) ? categories : [categories].filter(Boolean);
        const selectedBrands = Array.isArray(brands) ? brands : [brands].filter(Boolean);

        let query = {
            status: "listed",
        };

        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        if (selectedBrands.length > 0) {
            query.brand = { $in: selectedBrands };
        }

        // const filteredProducts = await Products.find(query).populate({ path: "category", match: { status: "listed" } });
        const filteredProducts = await Products.find({status: "listed"});

        console.log(filteredProducts)

        const searchedProducts = filteredProducts.filter((product) => regex.test(product.description));

        const paginatedProducts = searchedProducts.slice(skip, skip + limit);

        const offers = await Offers.find({ isActive: true });
        const productsWithBestOffers = paginatedProducts.map((product) => {
            const bestOffer = findBestOffer(product, offers);
            return {
                ...product.toObject(),
                bestOffer,
            };
        });

        const totalProducts = searchedProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const userLoggedIn = req.session.user ? true : false;

        const categoriesList = await Category.find({ status: "listed" });

        const categoriesWithCounts = await Promise.all(
            categoriesList.map(async (category) => {
                const count = await Products.countDocuments({ category: category._id, status: "listed" });
                return { ...category.toObject(), productCount: count };
            })
        );

        // console.log({
        //     userLoggedIn,
        //     user,
        //     search,
        //     products: productsWithBestOffers,
        //     currentPage: Number(page),
        //     totalPages,
        //     title,
        //     categories: categoriesList,
        //     categoriesWithCounts,
        //     sortby,
        //     selectedCategories,
        //     selectedBrands,
        // })

        res.render("user/shop", {
            userLoggedIn,
            user,
            search,
            products: productsWithBestOffers,
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
        res.status(500).send("An error occurred while fetching the shop data.");
    }
};

// controller for getting specific product details - get method
const getProductDetail = async (req, res) => {
    try {
        const title = "Product detail page | Byteverse E-commerce";
        const productId = req.params.productId;
        const userId = req.session.userId;

        const user = await User.findById(userId);
        const userLoggedIn = req.session.user ? true : false;

        const product = await Products.findOne({ _id: productId }).populate({
            path: "category",
            match: { status: "listed" },
        });

        if (!product) {
            return res.status(404).send("Product not found.");
        }

        const offers = await Offers.find({ isActive: true });

        const bestOffer = findBestOffer(product, offers);

        const relatedProducts = await Products.find({
            category: product.category._id,
            _id: { $ne: productId },
            status: "listed",
        })
            .limit(4)
            .exec();

        res.render("user/product-detail.ejs", {
            userLoggedIn,
            product: { ...product.toObject(), bestOffer },
            relatedProducts,
            title,
            user,
        });
    } catch (error) {
        console.error("Error from get product detail page: \n", error);
        res.status(500).send("An error occurred while fetching the product details.");
    }
};

module.exports = {
    getShop,
    getProductDetail,
};
