const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("index", { title: "SmartPrep-Integrated Placement Test and Chatbot System" });
});

router.get("/user/", (req, res) => {
    res.render("user/index");
});

router.get("/studlogin", (req, res) => {
    res.render("studlogin");
});

router.get("/signin", (req, res) => {
    res.render("signin");
});

router.get("/user/test", (req, res) => {
    res.render("user/test");
});

router.get("/aboutus", (req, res) => {
    res.render("aboutus");
});
/*
router.get("/user/chatbot", (req, res) => {
    res.render("user/chatbot");
});*/
router.get("/instructions", (req, res) => {
    res.render("instructions");
});
router.get("/contactus", (req, res) => {
    res.render("contactus");
});

router.get("/user/contactus", (req, res) => {
    res.render("user/contactus");
});

router.get("/adminsignin", (req, res) => {
    res.render("adminsignin");
});

/* router.get("/user/result", (req, res) => {
    res.render("user/result");
}); */
/*
router.get("/user/report", (req, res) => {
    res.render("user/report");
});
*/

router.get("/user/schedule", (req, res) => {
    res.render("user/schedule");
});

router.get("/user/suggestions", (req, res) => {
    res.render("user/suggestions");
});

router.get("/user/instructions", (req, res) => {
    res.render("user/instructions");
});

router.get("/user/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/signin"); // Redirect if not logged in
    }
    res.render("user/dashboard", { user: req.session.user });

});


module.exports = router;
