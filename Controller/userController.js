const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../model/user");
const bcrypt = require("bcrypt");
const OTP = require("../model/OTP");
const session = require("express-session");
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
        res.render("user/home");
    } catch (error) {
        console.error("Error from get Guest login page : \n", error);
    }
};

const getLogin = async (req, res) => {
    try {
        res.render("user/login");
    } catch (error) {
        console.error("Error from rendering user login page : \n", error);
    }
};

const postHome = async (req, res) => {
    try {
        res.redirect("/login");
    } catch (error) {
        console.error("Error from post user login page : \n", error);
    }
};

const getOTPVerify = async (req, res) => {
    try {
        res.render("user/otpVarify");
    } catch (error) {
        console.error("Error from get otp verify page : \n", error);
    }
};

const postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // let isUserExist = await User.findOne({ email });

        // if (isUserExist) {
        //     return res.send("User Exist");
        // }

        const otp = generateOTP(); // Generate a new OTP
        const hashedOTP = await securePassword(otp);
        const createdAt = Date.now();

        req.session.userTemp = { username, email, password, otp };

        await OTP.findOneAndUpdate({ email: email }, { otp: hashedOTP, createdAt: createdAt, verified: false }, { new: true, upsert: true });

        await sendOTPEmail(email, otp); // Send the OTP email

        res.redirect("/signup");
    } catch (error) {
        res.status(500).json({ message: "Error sending OTP", error: error.message });
    }
};

const varifyOTP = async (req, res) => {
    try {
        const { username, email, password } = req.session.userTemp;
        // const { otp } = req.body;
        // console.log(username, email, password, otp);
        // console.log("req.body.otp : ", otp);

        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const otp = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

        const otpRecord = await OTP.findOne({ email: email });

        if (!otpRecord) {
            return res.send("NO OTP found");
        }

        const currentTime = Date.now();
        const otpCreatedAt = otpRecord.createdAt.getTime();
        const otpAge = currentTime - otpCreatedAt;
        const otpDuration = Number(process.env.OTP_VALIDITY_DURATION) || 180000;

        // console.log(otpAge);
        // console.log(otpDuration);

        if (otpAge > otpDuration) {
            return res.send("OTP has been expireed");
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
            });

            // await newUser.save();

            res.redirect("/");
        } else {
            return res.send("Invalid OTP");
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

module.exports = {
    getHome,
    getLogin,
    postHome,
    getOTPVerify,
    postSignup,
    varifyOTP,
    resendOTP,
};
