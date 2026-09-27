const express = require("express");
const router = express.Router();
const csrf = require("csurf");
const csrfProtection = csrf();

const User = require("../models/User");   // ✅ Add this line
const ProctorImage = require("../models/ProctorImage");
const Test = require("../models/Test");
const Result = require("../models/Result");
const TestSchedule = require("../models/TestSchedule");
const { verifyUser } = require("../middleware/auth");
const testController = require("../controllers/testController");

router.get("/camera-check/:testId", verifyUser, (req, res) => {
    res.render("user/camera-check", { testId: req.params.testId, csrfToken: req.csrfToken() });
});



// After camera check, start test
router.get("/start-test/:testId", (req, res) => {
    res.render("start-test", { testId: req.params.testId });
});

router.post("/proctor-upload", async (req, res) => {
    try {
        const { image, testId } = req.body;

        if (!image) {
            return res.status(400).json({ status: "error", message: "No image received" });
        }

        // Save proctor image record
        const doc = await ProctorImage.create({
            testId: testId || null,
            image: image,
            timestamp: new Date()
        });

        // optionally also attach to the user record (uncomment if desired)
        /*
        await User.updateOne(
            { _id: req.session.userId },
            { $set: { proctorImage: image, lastTestProctored: testId } }
        );
        */

        return res.json({ status: "ok", id: doc._id });
    } catch (err) {
        console.error("Proctor upload error:", err);
        return res.status(500).json({ status: "error", message: "Server failed to save image" });
    }
});




// ✅ Use controller to handle test submission
router.post('/submit-test', verifyUser, testController.postSubmitTest);

// ✅ Dashboard – Show all tests & results
router.get('/dashboard', verifyUser, async (req, res, next) => {
    try {
        const tests = await Test.find({});
        const results = await Result.find({ userId: req.session.user._id }).populate('testId');
        res.render('user/dashboard', {
            user: req.session.user,
            tests,
            results
        });
    } catch (err) {
        next(err);
    }
});

// ✅ GET Profile
router.get("/profile", verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("user/profile", {
      user,
      success: req.query.success,   // ✅ pass success
      error: req.query.error        // ✅ pass error
    });
  } catch (err) {
    console.error(err);
    res.redirect("/user/dashboard?error=Unable to load profile");
  }
});

// POST: Update Profile
router.post("/profile", verifyUser, async (req, res) => {
  try {
    const { studentName, studentClass, email, password } = req.body;

    const updateData = {
      studentName,
      studentClass,
      email
    };

    // If user entered a new password, hash it before saving
    if (password && password.trim() !== "") {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await User.findByIdAndUpdate(req.session.userId, updateData);

    res.redirect("/user/profile?success=1");
  } catch (err) {
    console.error(err);
    res.redirect("/user/profile?error=Unable to update profile");
  }
});




// ✅ Test List Page
router.get('/test/list', verifyUser, csrfProtection, async (req, res) => {
    try {
        const submitted = req.query.submitted === 'true';
        const alreadySubmitted = req.session.alreadySubmitted || false;
        req.session.alreadySubmitted = false;

        const tests = await Test.find({});
        res.render('user/testList', {
            user: req.session.user,
            tests,
            submitted,
            alreadySubmitted,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error("Error loading test list:", err);
        res.status(500).send("Failed to load test list");
    }
});

// ✅ Start a Test
router.get('/test/start/:id', verifyUser, csrfProtection, async (req, res) => {
    try {
        const testId = req.params.id;
        const userId = req.session.user._id;

        const existingResult = await Result.findOne({ userId, testId });
        if (existingResult) {
            req.session.alreadySubmitted = true;
            return res.redirect('/user/test/list');
        }

        const test = await Test.findById(testId);
        if (!test) return res.status(404).render('error', { message: 'Test not found' });

        res.render('user/test', {
            test,
            user: req.session.user,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error("Error starting test:", err);
        res.status(500).send("Unable to load test");
    }
});

// ✅ View Latest Result — place before /result/:id
router.get('/result/latest', verifyUser, async (req, res) => {
    try {
        const result = await Result.findOne({ userId: req.session.user._id })
            .sort({ submittedAt: -1 })
            .populate('testId');

        if (!result) {
            return res.status(404).render('error', { message: 'No recent result found.' });
        }

        res.render('user/result', {
            user: req.session.user,
            result
        });
    } catch (err) {
        console.error("Error fetching latest result:", err);
        res.status(500).render('error', { message: 'Failed to load latest result.' });
    }
});

// ✅ View Individual Result
router.get('/result/:id', verifyUser, async (req, res) => {
    try {
        const result = await Result.findById(req.params.id).populate('testId');
        if (!result || result.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).render('error', { message: 'Access denied to this result' });
        }

        res.render('user/result', {
            user: req.session.user,
            result
        });
    } catch (err) {
        console.error("Error fetching result:", err);
        res.status(500).render('error', { message: 'Something went wrong.' });
    }
});

// ✅ View All Results
router.get('/result', verifyUser, async (req, res) => {
    try {
        const results = await Result.find({ userId: req.session.user._id }).populate('testId');
        res.render('user/viewResults', {
            user: req.session.user,
            results
        });
    } catch (err) {
        console.error("Error loading user results:", err);
        res.status(500).render('error', { message: 'Could not load your results.' });
    }
});

// ✅ Test Schedule
router.get('/schedule', verifyUser, async (req, res) => {
    try {
        const scheduleData = await TestSchedule.findOne().populate('tests');
        res.render('user/testSchedule', {
            scheduleData: scheduleData || { note: '', timings: {}, tests: [] },
            user: req.session.user || { firstName: "Student" }
        });
    } catch (err) {
        console.error("Error loading test schedule:", err);
        res.status(500).render('error', { message: 'Schedule not available' });
    }
});

// ✅ Default fallback route
router.get('/studentDashboard', verifyUser, (req, res) => {
    res.render('user/dashboard', {
        user: req.session.user || { firstName: "Student" }
    });
});

// Report 
router.get('/report', async (req, res) => {
    try {
        const userId = req.session.user._id; // logged-in user

        // Fetch all results for this user
        const results = await Result.find({ userId }).populate("testId");

        // Prepare arrays for chart + table
        const testNames = results.map(r => r.testId?.title || "Untitled Test");
        const scores = results.map(r => r.score);
        const totalMarks = results.map(r => r.totalMarks);
        const testIds = results.map(r => r.testId?._id); // ✅ Added

        res.render("user/report", {
            user: req.session.user || { username: "Student" },
            testNames,
            scores,
            totalMarks,
            testIds   // ✅ Pass to frontend
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading report");
    }
});

router.get("/retake/:testId", async (req, res) => {
  try {
    const { testId } = req.params;

    // Find the test details
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).send("Test not found");
    }

    // Render the test-taking page (reuse your test view page)
    res.render("user/test", {
      user: req.session.user,
      test
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading test for retake");
  }
});



module.exports = router;
