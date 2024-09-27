const express = require("express");
const path = require("path");
const session = require("express-session");
const connectDB = require("./db/connectDB");
const userRoutes = require("./routes/User/login");
const adminRoutes = require("./routes/Admin/admin");
const morgan = require("morgan");
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

app.use(
    session({
        secret: "secretKey",
        resave: false,
        saveUninitialized: true,
    })
);

app.use("/", userRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
    res.status(404).send("Page not found");
});

connectDB();

app.listen(port, () => {
    console.log("===============================");
    console.log("http://localhost:3000");
    console.log("===============================");
});
