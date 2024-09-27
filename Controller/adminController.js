const getAdminLogin = async (req, res) => {
    try {
        res.render("admin/login");
    } catch (error) {
        console.error("Error from rendering admin Login page : \n ", error);
    }
};

const postAdminLogin = async (req, res) => {
    try {
        const adminUsername = "admin";
        const adminPassword = 123456;

        const { username, password } = req.body;

        if (adminUsername == username && adminPassword === password) {
            res.send("Admin dashboard rendered successfully");
        }
    } catch (error) {
        console.error("Error from posting admin Login page : \n", error);
    }
};

module.exports = {
    getAdminLogin,
    postAdminLogin,
};
