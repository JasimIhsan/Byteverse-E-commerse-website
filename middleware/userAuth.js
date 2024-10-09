const checkSession = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
};

const isLogged = (req, res, next) => {
    if (req.session.user) {
        res.redirect("/");
    } else {
        next();
    }
};

function checkOrderPlaced(req, res, next) {
    if (req.session.orderPlaced) {
        const userId = req.session.userId;
        return res.redirect(`/${userId}/cart`);
    } else {
        next();
    }
}

module.exports = {
    checkSession,
    isLogged,
    checkOrderPlaced,
};
