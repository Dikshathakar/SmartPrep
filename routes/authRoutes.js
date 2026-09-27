const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

// ✅ Middleware to check authentication
function isAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.redirect("/studlogin");
}

// ✅ Manual Student Registration
router.post("/submit", async (req, res) => {
    const { studentName, email, studentClass, prn, password } = req.body;

    if (!studentName || !studentClass || !prn || !password) {
        return res.status(400).json({ success: false, error: "All required fields must be filled" });
    }

    try {
        const existingUser = await User.findOne({ prn });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "PRN already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            studentName,
            email: email || "",
            studentClass,
            prn,
            password: hashedPassword
        });

        res.json({ success: true, redirect: "/signin" });

    } catch (err) {
        res.status(500).json({ success: false, error: "Server error: " + err.message });
    }
});

// ✅ Login with PRN
router.post("/submitSignin", async (req, res) => {
    const { prn, password } = req.body;

    if (!prn || !password) {
        return res.status(400).json({ success: false, error: "PRN and password are required" });
    }

    try {
        const user = await User.findOne({ prn });
        if (!user) return res.status(400).json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });

        req.session.userId = user._id;
        req.session.user = user;

        res.json({ success: true, redirect: "/user/dashboard" });

    } catch (err) {
        res.status(500).json({ success: false, error: "Server error: " + err.message });
    }
});

// ✅ Change Password (when user is logged in)
router.post("/change-password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: "Not logged in" });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Old password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Password changed successfully!" });

    } catch (err) {
        res.status(500).json({ success: false, error: "Server error: " + err.message });
    }
});


// ✅ Forgot Password - PRN Verification (no email)
router.post("/verify-prn", async (req, res) => {
    const { prn } = req.body;

    try {
        const user = await User.findOne({ prn });
        if (!user) {
            return res.status(400).json({ success: false, error: "PRN not found" });
        }

        res.json({ success: true, prn: user.prn }); // send PRN back for frontend to redirect
    } catch (err) {
        res.status(500).json({ success: false, error: "Server error: " + err.message });
    }
});

// ✅ Show Reset Password Form (GET)
router.get("/reset-password/:prn", async (req, res) => {
    const { prn } = req.params;

    try {
        const user = await User.findOne({ prn });
        if (!user) return res.send("Invalid PRN");

        res.render("resetPassword", { prn }); // render the reset form with PRN
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// ✅ Handle Reset Password Form Submission (POST)
router.post("/reset-password", async (req, res) => {
    const { prn, newPassword, confirmPassword } = req.body;

    if (!newPassword || newPassword !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    try {
        const user = await User.findOne({ prn });
        if (!user) return res.status(404).send("User not found");

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.redirect("/signin?success=Password reset successfully");

    } catch (err) {
        res.status(500).send("Error resetting password");
    }
});

// ✅ Logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send("Logout error");
        res.clearCookie("connect.sid");
        res.redirect("/studlogin?loggedout=1");
    });
});

module.exports = router;
