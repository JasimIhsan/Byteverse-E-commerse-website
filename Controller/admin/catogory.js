const getCategory = async (req, res) => {
    try {
        res.render("admin/catogery");
    } catch (error) {
        console.error("Error from get Category : \n", error);
    }
};

module.exports = {
    getCategory,
};
