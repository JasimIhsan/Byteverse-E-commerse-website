const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./db/connectDB");
const userRoutes = require("./routes/User/login");
const adminRoutes = require("./routes/Admin/admin");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");

const passport = require("passport");
const methodOverride = require("method-override");
const multer = require("multer");
require("dotenv").config();

const app = express();
const port = 3000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(morgan("common"));

app.use(express.static("public"));
app.use(express.static("uploads"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            collectionName: "sessions",
        }),
        cookie: {
            maxAge: 1000 * 60 * 60,
        },
    })
);

app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
    if (req.originalUrl.startsWith("/admin")) {
        res.render("admin/404", { redirectUrl: "/admin/dashboard" });
    } else {
        res.render("admin/404", { redirectUrl: "/" });
    }
});

connectDB();

app.listen(port, () => {
    console.log("==========================");
    console.log("http://localhost3000 : ✅");
});
