const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../../model/user");
const bcrypt = require("bcrypt");
const OTP = require("../../model/OTP");
const session = require("express-session");
const Products = require("../../model/product");
require("dotenv").config();

//======================================== functions ==========================================//

//=================== secure password =======================//

const securePassword = async (password) => {
    try {
        const hash = await bcrypt.hash(password, 10);
        return hash;
    } catch (error) {
        console.error("Error from Password hashing : \n", error);
    }
};

//====================== Nodemailer transporter setup =======================//

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

//=========================== generate OTP =============================//

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// ============================= send OTP to user's mail =========================//

const sendOTPEmail = async (email, otp) => {
    console.log(email);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Signup",
        text: `Your OTP for verification is ${otp}. It is valid for 3 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};

//=================================================== routes =====================================================//

const getHome = async (req, res) => {
    try {
        const title = "Home page | Byteverse E-commerce";
        const { search = "", page = 1 } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;
        // const regex = new RegExp("^" + search, "i");

        const products = await Products.find({ status: "listed" })
            .sort({ updatedAt: -1 })
            .populate({ path: "category", match: { status: "listed" } })
            .skip(skip)
            .limit(limit);

        const filteredProducts = products.filter((product) => product.category);

        const totalProducts = await Products.countDocuments({ name: { $regex: search, $options: "i" }, status: "listed" }).populate({ path: "category", match: { status: "listed" } });
        const totalPages = Math.ceil(totalProducts / limit);
        
        const userLoggedIn = req.session.user ? true : false;
        if (userLoggedIn) {
            const userId = req.session.userId;
            const user = await User.findById(userId);
            return res.render("user/home", { userLoggedIn, user, products: filteredProducts, currentPage: Number(page), totalPages, title });
        }

        res.render("user/home", { userLoggedIn, products: filteredProducts, currentPage: Number(page), totalPages, title });
    } catch (error) {
        console.error("Error from get Guest login page : \n", error);
    }
};

const getLogin = async (req, res) => {
    try {
        const error = req.query.error;
        // const success = req.query.success;
        res.render("user/login", { message: error });
    } catch (error) {
        console.error("Error from rendering user login page : \n", error);
    }
};

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(email);
        console.log(password);

        const user = await User.findOne({ email });

        if (user) {
            // console.log("User found:", user);

            if (user.status == "Blocked") {
                // console.log("User is blocked");
                return res.redirect("/login?error=User is Blocked");
            }

            const isMatched = await bcrypt.compare(password, user.password);
            // console.log("Password match:", isMatched);

            if (isMatched) {
                req.session.user = true;
                req.session.userId = user._id;
                // console.log("User logged in:", user._id);
                return res.redirect("/");
            } else {
                // console.log("Incorrect password");
                return res.redirect("/login?error=Incorrect email or password");
            }
        } else {
            // console.log("User does not exist");
            return res.redirect("/login?error=User does not exist");
        }
    } catch (error) {
        console.error("Error from post login page : \n", error);
        return res.status(500).send("Internal Server Error");
    }
};

const postHome = async (req, res) => {
    try {
        res.redirect("/login");
    } catch (error) {
        console.error("Error from post user login page : \n", error);
    }
};

const getEnterOTP = async (req, res) => {
    try {
        const error = req.query.error;
        res.render("user/otpVarify", { message: error });
    } catch (error) {
        console.error("Error from get otp verify page : \n", error);
    }
};

const postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        let isUserExist = await User.findOne({ email });

        if (isUserExist) {
            return res.redirect("/login?error=User already Exist");
        }

        const otp = generateOTP(); // Generate a new OTP
        const hashedOTP = await securePassword(otp);
        const createdAt = Date.now();

        req.session.userTemp = { username, email, password, otp };

        await OTP.findOneAndUpdate({ email: email }, { otp: hashedOTP, createdAt: createdAt, verified: false }, { new: true, upsert: true });

        await sendOTPEmail(email, otp); // Send the OTP email

        res.redirect("/login/enter-otp");
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};

const varifyOTP = async (req, res) => {
    try {
        const { username, email, password } = req.session.userTemp;

        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

        const otpRecord = await OTP.findOne({ email: email });

        if (!otpRecord) {
            return res.redirect("/login/enter-otp?error=OTP not found");
        }

        const currentTime = Date.now();
        const otpCreatedAt = otpRecord.createdAt.getTime();
        const otpAge = currentTime - otpCreatedAt;
        const otpDuration = Number(process.env.OTP_VALIDITY_DURATION) || 180000;

        if (otpAge > otpDuration) {
            return res.redirect("/login/enter-otp?error=OTP has expired");
        }

        const isMatched = await bcrypt.compare(otp, otpRecord.otp);

        if (isMatched) {
            //mark as varified to not to use again
            req.session.user = true;
            await otpRecord.save();

            const hashedPassword = await securePassword(password);

            newUser = new User({
                username: username,
                email: email,
                password: hashedPassword,
                googleId: null,
            });

            await newUser.save();

            req.session.user = true;
            req.session.userId = user._id;

            res.redirect("/");
        } else {
            return res.redirect("/login/enter-otp?error=Invalid OTP");
        }
    } catch (error) {
        console.error("Error in varifiying OTP : \n", error);
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.session.userTemp;

        const otp = generateOTP();
        const hashedOTP = await securePassword(otp);

        const createdAt = Date.now();

        await OTP.findOneAndUpdate({ email: email }, { otp: hashedOTP, createdAt: createdAt, verified: false }, { new: true, upsert: true });

        await sendOTPEmail(email, otp); // Send the OTP email

        res.send("OTP resended");
    } catch (error) {
        console.error("Error from resending OTP : ", error);
    }
};

const handleGoogleAuth = async (req, res) => {
    // Check if the user is already logged in
    if (req.session.user) {
        // Optionally, you could redirect them to a different page or display a message
        return res.redirect("/?error=You are already signed in");
    }

    // If the user is not logged in, proceed with Google authentication
    req.session.user = req.user;
    res.redirect("/");
};

//----------------------------- product detail page ------------------------------//

const getProductDetail = async (req, res) => {
    try {
        const title = "Product detail page | Byteverse E-commerce";
        const productId = req.params.productId;

        const product = await Products.findOne({ _id: productId }).populate({
            path: "category",
            match: { status: "listed" },
        });

        let errorMessage = null;
        // Check if the product is found
        if (!product) {
            return res.render("user/product-detail", {
                user: req.session.user ? true : false,
                product: null,
                relatedProducts: [],
                title,
                errorMessage: "Product not found.",
            });
        }

        // Check if the category exists and is listed
        if (!product.category) {
            return res.render("user/product-detail", {
                user: req.session.user ? true : false,
                product,
                relatedProducts: [],
                title,
                errorMessage: "Product category is not listed.",
            });
        }

        // Fetch related products only if category is valid
        const relatedProducts = await Products.find({
            category: product.category._id,
            _id: { $ne: productId },
            status: "listed",
        }).limit(4);

        res.render("user/product-detail", {
            user: req.session.user ? true : false,
            product,
            relatedProducts,
            title,
            errorMessage,
        });
    } catch (error) {
        console.error("Error from get product detail page : \n", error);
        res.status(500).render("error", {
            user: req.session.user ? true : false,
            errorMessage: "An error occurred while fetching product details.",
        });
    }
};

const Logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Unable to destroy user session", err);
            } else {
                res.redirect("/");
            }
        });
    } catch (error) {
        console.error("Error from logout user", error);
    }
};

module.exports = {
    getHome,
    getLogin,
    postLogin,
    postHome,
    getEnterOTP,
    postSignup,
    varifyOTP,
    resendOTP,
    handleGoogleAuth,
    //product detail page
    getProductDetail,
    Logout,
};
