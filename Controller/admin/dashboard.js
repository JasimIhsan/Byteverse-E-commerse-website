const getAdminLogin = async (req, res) => {
    try {
        const error_msg = req.query.error;
        res.render("admin/login", { error_msg });
    } catch (error) {
        console.error("Error from rendering admin Login page : \n ", error);
    }
};

const getAdminDashboard = async (req, res) => {
    try {
        const { search = "", page = 1 } = req.query;
        const regex = new RegExp("^" + search, "i");

        res.render("admin/dashboard", { search });
    } catch (error) {
        console.error("Error from rendering admin dashboard : \n", error);
    }
};

const postAdminLogin = async (req, res) => {
    try {
        const username = "admin";
        const password = 123456;

        const { adminUsername, adminPassword } = req.body;
        // console.log(adminUsername);
        // console.log(adminPassword);

        if (adminUsername == username && adminPassword == password) {
            req.session.admin = true;
            res.redirect("/admin/dashboard");
        } else {
            res.redirect("/admin?error=Incorrect password and username");
        }
    } catch (error) {
        console.error("Error from posting admin Login page : \n", error);
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Unable to destroy admin session : \n", err);
                res.redirect("/admin/dashboard");
            } else {
                res.redirect("/admin");
            }
        });
    } catch (error) {
        console.log("Error from logging out admin home : \n", error);
    }
};

module.exports = {
    getAdminLogin,
    getAdminDashboard,
    postAdminLogin,
    logout,
};
