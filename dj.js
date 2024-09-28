user_route.get(
    "/auth/google",
    auth.isAnyOne,
    auth.isblock,
    (req, res, next) => {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
        next();
    },
    passport.authenticate("google", { scope: ["profile", "email"] })
);

user_route.get("/auth/google/callback", auth.isAnyOne, auth.isblock, passport.authenticate("google", { failureRedirect: "/" }), function (req, res) {
    // Successful authentication
    req.session.user_id = req.user._id;
    req.session.is_verified = req.user.Is_verified;
    req.session.is_admin = req.user.Is_admin;

    // Create a simple HTML page that communicates with the main window
    res.send(`
            <script>
                // Notify the main window about successful login
                if (window.opener) {
                    // If admin, redirect to admin dashboard
                    if (${req.session.is_admin}) {
                        window.opener.location.href = '/admin/home';
                    } else {
                        // Otherwise, redirect to user account
                        window.opener.location.href = '/myaccount';
                    }
                    
                    // Close the current pop-up window
                    window.close();
                } else {
                    // If there's no main window, just redirect
                    window.location.href = '${req.session.is_admin ? "/admin/home" : "/myaccount"}';
                }
            </script>
        `);
});
