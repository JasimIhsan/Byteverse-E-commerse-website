const Offers = require("../../model/offers");
const Category = require("../../model/catogory");
const Products = require("../../model/product");

const getOffer = async (req, res) => {
    try {
        const itemsPerPage = 10;
        const currentPage = req.query.page || 1;
        const search = req.query.search || "";
        const regex = new RegExp("^" + search, "i");
        const skip = (currentPage - 1) * itemsPerPage;

        const totalOffers = await Offers.countDocuments({ title: { $regex: regex } });

        const offers = await Offers.find({ title: { $regex: regex } })
            .sort({ createdAt: -1 })
            .populate("applicableCategories")
            .populate("applicableProducts")
            .skip(skip)
            .limit(itemsPerPage);

        const categories = await Category.find({ status: "listed" });
        const products = await Products.find({ status: "listed" });

        // console.log("OFFERS : \n", offers);

        const totalPages = Math.ceil(totalOffers / itemsPerPage);

        res.render("admin/offers", { offers, currentPage: parseInt(currentPage), totalPages, search, categories, products });
    } catch (error) {
        console.error("Error from get offerManagement admin : \n", error);
        res.status(500).send("Server Error");
    }
};

const addOffer = async (req, res) => {
    try {
        const { title, discountAmount, offerType, minimumPrice, applicableCategories, applicableProducts, startDate, endDate } = req.body;

        const newOffer = new Offers({
            title,
            discountAmount,
            offerType,
            applicableCategories,
            applicableProducts,
            minimumPrice,
            startDate,
            endDate,
        });

        await newOffer.save();

        return res.status(201).json({ success: true, message: "Offer added successfully!" });
    } catch (error) {
        // Handle any validation errors or other errors
        console.error(error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

const updateOfferStatus = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { isActive } = req.body;

        const updatedOffer = await Offers.findByIdAndUpdate(offerId, { isActive }, { new: true });

        if (!updatedOffer) {
            return res.status(404).json({ success: false, message: "Offer not found." });
        }

        res.json({ success: true, message: `Offer ${isActive ? "activated" : "deactivated"} successfully!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update offer status." });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.params;

        const deletedOffer = await Offers.findByIdAndDelete(offerId);

        if (!deletedOffer) {
            return res.status(404).json({ success: false, message: "Offer not found." });
        }

        res.json({ sucess: true, message: "Offer deleted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to delete the offer." });
    }
};

const getOfferById = async (req, res) => {
    const { offerId } = req.params;

    try {
        const offer = await Offers.findById(offerId).populate("applicableCategories", "name").populate("applicableProducts", "name");

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        res.json(offer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to fetch offer details" });
    }
};

const editOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { title, discountAmount, minimumPrice, startDate, endDate, applicableCategories, applicableProducts, offerType } = req.body; // Data from the request body

        const offer = await Offers.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        offer.title = title;
        offer.discountAmount = discountAmount;
        offer.minimumPrice = minimumPrice;
        offer.startDate = startDate;
        offer.endDate = endDate;
        offer.applicableCategories = applicableCategories;
        offer.applicableProducts = applicableProducts;
        offer.offerType = offerType;

        await offer.save();

        res.status(200).json({ success: true, message: "Offer updated successfully", offer });
    } catch (error) {
        console.error("Error updating offer:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = {
    getOffer,
    addOffer,
    updateOfferStatus,
    deleteOffer,
    getOfferById,
    editOffer,
};
