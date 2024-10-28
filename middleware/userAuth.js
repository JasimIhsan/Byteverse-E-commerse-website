const checkSession = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        return res.redirect("/login");
    }
};

const isLogged = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/");
    } else {
        next();
    }
};

function checkOrderPlaced(req, res, next) {
    if (req.session.orderPlaced) {
        return res.redirect(`/cart`);
    } else {
        next();
    }
}

module.exports = {
    checkSession,
    isLogged,
    checkOrderPlaced,
};
