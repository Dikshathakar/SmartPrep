const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/dashboard", async (req, res) => {
    try {
        console.log("Session User:", req.session.user); // Check if session is available

        if (!req.session.user) {
            console.log("User session is missing, redirecting to signin.");
            return res.redirect("/signin");
        }

        // Fetch user from DB
        const user = await User.findById(req.session.user._id);
        if (!user) {
            console.log("User not found in database, redirecting to signin.");
            return res.redirect("/signin");
        }

        console.log("User Data Fetched:", user); // Debugging output
        res.render("dashboard", { user }); // Pass user to EJS
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.status(500).send("Server Error");
    }
});


module.exports = router;
