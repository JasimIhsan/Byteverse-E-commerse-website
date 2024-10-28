const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../../model/user");
const bcrypt = require("bcrypt");
const OTP = require("../../model/OTP");
const session = require("express-session");
const Products = require("../../model/product");
const Offers = require("../../model/offers");
const { v4: uuidv4 } = require("uuid");
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

// ============================= find best offer =========================//

function findBestOffer(product, offers) {
    let bestOffer = null;
    const currentDate = new Date();

    const productOffers = offers.filter((offer) => offer.applicableProducts.includes(product._id) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const categoryOffers = offers.filter((offer) => offer.applicableCategories.includes(product.category) && offer.isActive && currentDate >= offer.startDate && currentDate <= offer.endDate && product.price >= offer.minimumPrice);

    const allOffers = [...productOffers, ...categoryOffers];

    if (allOffers.length > 0) {
        bestOffer = allOffers.reduce((best, current) => {
            return current.discountAmount > best.discountAmount ? current : best;
        });
    }

    return bestOffer;
}

//=================================================== routes =====================================================//

const getHome = async (req, res) => {
    try {
        const title = "Home page | Byteverse E-commerce";
        const { search = "", page = 1 } = req.query;
        const limit = 12;
        const skip = (page - 1) * limit;

        const products = await Products.find({ status: "listed" })
            .sort({ updatedAt: -1 })
            .populate({ path: "category", match: { status: "listed" } })
            .skip(skip)
            .limit(limit);

        const filteredProducts = products.filter((product) => product.category);

        const offers = await Offers.find({ isActive: true });

        const productsWithBestOffers = filteredProducts.map((product) => {
            const bestOffer = findBestOffer(product, offers);
            return {
                ...product.toObject(),
                bestOffer,
            };
        });

        const totalProducts = await Products.countDocuments({
            name: { $regex: search, $options: "i" },
            status: "listed",
        });

        const totalPages = Math.ceil(totalProducts / limit);

        const userLoggedIn = req.session.user ? true : false;

        if (userLoggedIn) {
            const userId = req.session.userId;
            const user = await User.findById(userId);
            return res.render("user/home", {
                userLoggedIn,
                user,
                products: productsWithBestOffers,
                currentPage: Number(page),
                totalPages,
                title,
            });
        }

        // Render the home page for guest users
        res.render("user/home", {
            userLoggedIn,
            products: productsWithBestOffers,
            currentPage: Number(page),
            totalPages,
            title,
        });
    } catch (error) {
        console.error("Error from get Home page : \n", error);
        res.status(500).send("An error occurred while fetching the home page data.");
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

        req.session.userTemp = { username, email, password };
        // console.log('req.session.userTemp : ', req.session.userTemp);

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

        if (otpRecord.verified) {
            return res.redirect("/login/enter-otp?error=Invalid OTP");
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
            // Check if the user already exists
            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                req.session.userId = existingUser._id;
                return res.redirect("/login?error=User Exist");
            }

            const hashedPassword = await securePassword(password);

            newUser = new User({
                username: username,
                email: email,
                password: hashedPassword,
                googleId: null,
            });

            await newUser.save();

            otpRecord.verified = true;
            await otpRecord.save();

            // console.log(req.session.user);
            req.session.user = true;
            req.session.userId = newUser._id;

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
    if (req.session.user) {
        return res.redirect("/?error=You are already signed in");
    }

    req.session.userId = req.user._id;
    res.redirect("/");
};

const forgotPasswordEmailEnter = async (req, res) => {
    try {
        const errorMessage = req.query.error;
        res.render("user/forgot_password/emailenter", { message: errorMessage });
    } catch (error) {
        console.error("Error from forgot password email enter:", error);
        res.redirect("/login?error=Internal server error");
    }
};

const postForgotPasswordEmailEnter = async (req, res) => {
    try {
        const { email } = req.body;
        req.session.email = email;

        const user = await User.findOne({ email });
        if (!user) {
            return res.redirect("/login/enter-email?error=User not found");
        }

        const otp = generateOTP();
        console.log("OTP:", otp);
        const hashedOTP = await securePassword(otp);

        await sendOTPEmail(email, otp);

        const resetToken = uuidv4();
        const tokenExpiration = Date.now() + Number(3600000);

        await OTP.findOneAndUpdate({ email }, { otp: hashedOTP, resetToken, tokenExpiration, createdAt: Date.now() }, { upsert: true });

        res.redirect("/login/enter-email/otp-enter");
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const forgotOtp = async (req, res) => {
    try {
        const errorMessage = req.query.error;
        res.render("user/forgot_password/otp", { message: errorMessage });
    } catch (error) {
        console.error("Error from forgot OTP password:", error);
        res.redirect("/login?error=Internal server error");
    }
};

const verifyForgotPasswordOTP = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const email = req.session.email;
        const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;
        console.log("ENTERED OTP   : ", otp);
        console.log("ENTERED EMAIL : ", email);

        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord) {
            return res.redirect("/login/enter-email/otp-enter?error=OTP not found");
        }

        if (Date.now() > otpRecord.tokenExpiration) {
            return res.redirect("/login/enter-email/otp-enter?error=OTP has expired");
        }

        const isMatched = await bcrypt.compare(otp, otpRecord.otp);
        if (isMatched) {
            req.session.emailForPasswordReset = email;
            return res.redirect("/login/enter-email/otp-enter/new-password");
        } else {
            return res.redirect("/login/enter-email/otp-enter?error=Invalid OTP");
        }
    } catch (error) {
        console.error("Error in verifying OTP for forgot password:", error);
        return res.redirect("/forgot-password?error=Something went wrong");
    }
};

const getNewPassword = async (req, res) => {
    try {
        const errorMessage = req.query.error;
        res.render("user/forgot_password/resetpassword", { message: errorMessage });
    } catch (error) {
        console.error("Error from get new Password in forgot password:", error);
        res.redirect("/login?error=Internal server error");
    }
};

const postNewPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.session.emailForPasswordReset;
        console.log("req.body.password:", password);

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // console.log("USER.PASSWORD:", user.password);

        const hashedPassword = await securePassword(password);
        // console.log("HASHED:", hashedPassword);

        user.password = hashedPassword;
        await user.save();

        delete req.session.emailForPasswordReset;

        res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
        console.error("Error in resetting password:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
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
        console.log("logout");

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
    getProductDetail,
    Logout,
    forgotPasswordEmailEnter,
    postForgotPasswordEmailEnter,
    forgotOtp,
    verifyForgotPasswordOTP,
    getNewPassword,
    postNewPassword,
};
