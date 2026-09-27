const jwt = require("jsonwebtoken");

module.exports.verifyAdmin = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Unauthorized access" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified || !verified.isAdmin) return res.status(403).json({ error: "Forbidden" });
        req.admin = verified;
        next();
    } catch (err) {
        console.error("JWT Error:", err.message);
        res.status(400).json({ error: "Invalid token" });
    }
};
