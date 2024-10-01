const Category = require("../../model/catogory");

const getCategory = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const limit = 10;
        const skip = (page - 1) * limit;
        const regex = new RegExp("^" + search, "i");

        const catg = await Category.find({ name: { $regex: regex } })
            .sort({ joinedAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategory = await Category.countDocuments({ name: { $regex: search, $options: "i" } });
        const totalPages = Math.ceil(totalCategory / limit);

        const error_msg = req.query.error || "";
        const success_msg = req.query.success;
        res.render("admin/catogery", { category: catg, search: search, currentPage: Number(page), totalPages, error_msg, success_msg });
    } catch (error) {
        console.error("Error from get Category : \n", error);
    }
};

const editCategory = async (req, res) => {
    try {
        const { id, name, description } = req.body;

        const isExist = await Category.findOne({ name, _id: { $ne: id } });

        if (isExist) {
            return res.redirect("/admin/category-management?error=Category already Exists");
        }

        await Category.findByIdAndUpdate(id, { name, description });

        res.redirect("/admin/category-management?success=Category edited successfully");
    } catch (error) {
        console.error("Error from Catogory status update : \n", error);
    }
};

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        console.log(name, description);

        const isExist = await Category.findOne({ name });

        if (isExist) {
            return res.redirect("/admin/category-management?error=Category already exists");
        }

        const newCategory = new Category({
            name: name,
            description: description,
        });

        await newCategory.save();

        res.redirect("/admin/category-management?success=Category added successfully");
    } catch (error) {
        console.error("Error from adding category : \n", error);
    }
};

const editCategoryStatus = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const newStatus = req.body.status;
        await Category.findByIdAndUpdate(categoryId, { status: newStatus });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false });
    }
};

module.exports = {
    getCategory,
    editCategory,
    addCategory,
    editCategoryStatus,
};
