const getAdminLogin = async (req, res) => {
    try {
        res.render("admin/login");
    } catch (error) {
        console.error("Error from rendering admin Login page : \n ", error);
    }
};

const getAdminDashboard = async (req, res) => {
    try {
        res.render("admin/dashboard");
    } catch (error) {
        console.error("Error from rendering admin dashboard : \n", error);
    }
};

const postAdminLogin = async (req, res) => {
    try {
        const username = "admin";
        const password = 123456;

        const { adminUsername, adminPassword } = req.body;
        console.log(adminUsername);
        console.log(adminPassword);

        if (adminUsername == username && adminPassword == password) {
            console.log("keri");

            res.redirect("/admin/dashboard");
        } else {
            res.send("Incorrect password and username");
        }
    } catch (error) {
        console.error("Error from posting admin Login page : \n", error);
    }
};

module.exports = {
    getAdminLogin,
    getAdminDashboard,
    postAdminLogin,
};
