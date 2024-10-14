// Passport Configuration for Google Strategy

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists by googleId
                let existUser = await User.findOne({ googleId: profile.id });

                if (existUser) {
                    // Handle blocked users
                    if (existUser.status === "Blocked") {
                        return done(null, false, { message: "User is blocked" });
                    }
                    // Sign-In the existing user
                    return done(null, existUser);
                }

                // Check if user already exists by email (sign-in case)
                existUser = await User.findOne({ email: profile.emails[0].value });

                if (existUser) {
                    if (existUser.status === "Blocked") {
                        return done(null, false, { message: "User is blocked" });
                    }
                    // Link the Google account if email exists but no googleId
                    existUser.googleId = profile.id;
                    await existUser.save();
                    return done(null, existUser);
                }

                // Sign-Up (new user)
                const password = crypto.randomInt(10000000, 99999999).toString();
                const hashedPassword = await bcrypt.hash(password, 10);

                const newUser = new User({
                    googleId: profile.id,
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    password: hashedPassword,
                });

                await newUser.save();
                done(null, newUser);
            } catch (error) {
                console.error("Error from passport setup: \n", error);
                done(error, null);
            }
        }
    )
);
// Serialization and Deserialization

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});

module.exports = passport; // Export the configured passport
