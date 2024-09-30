const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./db/connectDB");
const userRoutes = require("./routes/User/login");
const adminRoutes = require("./routes/Admin/admin");
const morgan = require("morgan");
const passport = require("passport");
const methodOverride = require("method-override");
require("dotenv").config();

const app = express();
const port = 3000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
// app.use(morgan("common"));

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// Initialize session before Passport
app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: true,
    })
);

// Initialize Passport after session
app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method")); // Using `_method` as the key to check for method overrides

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
    res.render("admin/404");
});

connectDB();

app.listen(port, () => {
    console.log("===============================");
    console.log("http://localhost:3000");
    console.log("===============================");
});
