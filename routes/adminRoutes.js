const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

const Admin = require("../models/Admins");
const User = require("../models/User");
const Test = require("../models/Test");
const Result = require("../models/Result");
const TestSchedule = require("../models/TestSchedule");
const adminController = require("../controllers/adminController");

function isAdmin(req, res, next) {
  if (!req.session.admin) return res.redirect("/adminsignin");
  next();
}

/* ─────────────── 🔐 Admin Authentication ─────────────── */
router.get("/adminsignin", (req, res) => {
  res.render("adminsignin", { error: null, csrfToken: req.csrfToken() });
});

router.post("/adminsignin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.render("adminsignin", {
        error: "Invalid email or password.",
        csrfToken: req.csrfToken()
      });
    }
    req.session.admin = { id: admin._id, email: admin.email };
    res.redirect("/admin/adminDashboard");
  } catch (err) {
    res.render("adminsignin", { error: "Server error.", csrfToken: req.csrfToken() });
  }
});

router.get("/adminDashboard", isAdmin, (req, res) => {
  res.render("admin/adminDashboard", { admin: req.session.admin });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/adminsignin");
  });
});

/* ─────────────── 👥 Manage Users ─────────────── */
router.get("/manageUsers", isAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ studentName: 1 });
    res.render("admin/manageUsers", { users });
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.render("admin/manageUsers", { users: [] });
  }
});

router.get("/editUser/:id", isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect("/admin/manageUsers");
    res.render("admin/editUser", { user });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.redirect("/admin/manageUsers");
  }
});

router.post("/editUser/:id", isAdmin, async (req, res) => {
  try {
    const { studentName, studentClass, email } = req.body;
    await User.findByIdAndUpdate(req.params.id, {
      studentName,
      studentClass,
      email
    });
    res.redirect("/admin/manageUsers");
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.redirect("/admin/manageUsers");
  }
});

router.get("/deleteUser/:id", isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect("/admin/manageUsers");
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.redirect("/admin/manageUsers");
  }
});

/* ─────────────── 📂 Upload Students ─────────────── */
router.get("/upload-students", isAdmin, (req, res) => {
  res.render("admin/uploadStudents", { csrfToken: req.csrfToken() });
});

router.post("/upload-students", isAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = xlsx.utils.sheet_to_json(sheet);

    console.log("📄 Total rows in Excel:", students.length);

    let insertedCount = 0;
    let skippedCount = 0;
    let errorRows = [];

    for (const row of students) {
      try {
        const studentName = row["Student Name"] || row["Name"] || row["Full Name"];
        const prn = row["PRN No"] || row["PRN"] || row["Prn"];

        if (!prn || !studentName) {
          console.warn("⚠️ Missing Name or PRN in row:", row);
          skippedCount++;
          continue;
        }

        const exists = await User.findOne({ prn });
        if (exists) {
          console.warn(`⚠️ Duplicate PRN skipped: ${prn}`);
          skippedCount++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(prn.toString(), 12);
        const dummyEmail = `${prn}@smartprep.com`;

        await User.create({
          studentName,
          prn,
          email: dummyEmail,
          studentClass: "Pending",
          password: hashedPassword
        });

        console.log(`✅ Inserted: ${studentName} (${prn})`);
        insertedCount++;
      } catch (rowError) {
        console.error("❌ Error saving row:", rowError);
        errorRows.push(row);
      }
    }

    fs.unlinkSync(req.file.path);
    console.log(`📊 Upload Summary: Inserted = ${insertedCount}, Skipped = ${skippedCount}, Errors = ${errorRows.length}`);

    res.redirect("/admin/manageUsers");
  } catch (err) {
    console.error("❌ Upload Error (outer catch):", err);
    res.status(500).send("Error uploading students.");
  }
});

/* ─────────────── 🧪 Test Management ─────────────── */
router.get("/createTest", isAdmin, adminController.getCreateTestPage);
router.post("/createTest", isAdmin, adminController.postCreateTest);
router.get("/manageTests", isAdmin, adminController.getManageTests);
router.post("/deleteTest/:id", isAdmin, adminController.postDeleteTest);

router.post("/upload-excel", isAdmin, upload.single("excel"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded.");

        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Shuffle and pick 20 questions
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 20);

        const questions = shuffled.map(row => {
            const options = [
                row.Answer1?.toString() || "Option1",
                row.Answer2?.toString() || "Option2",
                row.Answer3?.toString() || "Option3",
                row.Answer4?.toString() || "Option4"
            ];

            // Ensure correctAnswer exists in options
            let correctAnswerText = options.includes(row["Correct Answer"]?.toString())
                ? row["Correct Answer"].toString()
                : options[0]; // default to first option if mismatch

            return {
                questionText: row.Questions?.toString() || "Untitled Question",
                options,
                correctAnswer: correctAnswerText,
                score: parseInt(row.Score) || 1,
                topic: row.Topic?.toString() || "General",
                level: row.Level?.toString() || "Medium"
            };
        });

        const newTest = new Test({
            title: req.body.title || "Untitled Test",
            questions,
            createdAt: new Date()
        });

        await newTest.save();

        fs.unlinkSync(req.file.path);
        res.redirect("/admin/manageTests?success=true");

    } catch (err) {
        console.error("Excel Upload Error:", err);
        res.status(500).send("Failed to process Excel file. Check console for details.");
    }
});



/* ─────────────── 📊 Results ─────────────── */
router.get("/result/add", isAdmin, async (req, res) => {
  const users = await User.find();
  const tests = await Test.find();
  const results = await Result.find().populate("userId").populate("testId");
  res.render("admin/addResult", { users, tests, results, success: null, error: null });
});

router.post("/result/add", isAdmin, async (req, res) => {
  try {
    const { userId, testId, score, answers } = req.body;
    await Result.create({ userId, testId, score, answers: JSON.parse(answers) });
    res.redirect("/admin/result/add");
  } catch (err) {
    res.status(500).send("Error adding result.");
  }
});

router.get("/result/edit/:id", isAdmin, adminController.getEditResult);
router.post("/result/edit/:id", isAdmin, adminController.postEditResult);
router.post("/result/delete/:id", isAdmin, async (req, res) => {
  await Result.findByIdAndDelete(req.params.id);
  res.redirect("/admin/result/add");
});

/* ─────────────── 📅 Test Schedule ─────────────── */

// Show all schedules
router.get("/schedule", isAdmin, async (req, res) => {
  try {
    const schedules = await TestSchedule.find().populate("tests.test");
    res.render("admin/viewSchedule", { schedules, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).send("Error fetching schedules");
  }
});

// Show form to create new schedule
router.get("/schedule/create", isAdmin, async (req, res) => {
  try {
    const tests = await Test.find();
    res.render("admin/testSchedule", { tests, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error("Error loading create schedule form:", err);
    res.status(500).send("Error loading form");
  }
});


router.post("/schedule/create", isAdmin, async (req, res) => {
  try {
    const { examDate } = req.body;

    const newSchedule = new TestSchedule({
      examDate,
      tests: [
        {
          testNo: 1,
          test: req.body.test1 || null,
          type: req.body.type1,
          subtype: req.body.subtype1,
          marks: req.body.marks1 || 0,
          startTime: req.body.startTime1,
          endTime: req.body.endTime1,
        },
        {
          testNo: 2,
          test: req.body.test2 || null,
          type: req.body.type2,
          subtype: req.body.subtype2,
          marks: req.body.marks2 || 0,
          startTime: req.body.startTime2,
          endTime: req.body.endTime2,
        },
        {
          testNo: 3,
          test: req.body.test3 || null,
          type: req.body.type3,
          subtype: req.body.subtype3,
          marks: req.body.marks3 || 0,
          startTime: req.body.startTime3,
          endTime: req.body.endTime3,
        },
      ],
    });

    await newSchedule.save();
    res.redirect("/admin/schedule");
  } catch (err) {
    console.error("Error saving schedule:", err);
    res.status(500).send("Error saving schedule");
  }
}); 

// Show edit form
router.get("/schedule/:id/edit", isAdmin, async (req, res) => {
  try {
    const schedule = await TestSchedule.findById(req.params.id).populate("tests.test");
    const tests = await Test.find();
    res.render("admin/editSchedule", { schedule, tests, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Error loading form");
  }
});

// Handle update (use PUT method override)
router.put("/schedule/:id", isAdmin, async (req, res) => {
  try {
    const { examDate, tests } = req.body;

    // Ensure tests is always an array
    const formattedTests = Array.isArray(tests)
      ? tests.map((t, i) => ({
          testNo: t.testNo || i + 1,
          test: t.test || null,
          type: t.type || "N/A",
          subtype: t.subtype || "N/A",
          marks: t.marks || 0,
          startTime: t.startTime || "N/A",
          endTime: t.endTime || "N/A",
        }))
      : [];

    await TestSchedule.findByIdAndUpdate(
      req.params.id,
      {
        examDate,
        tests: formattedTests,
      },
      { new: true }
    );

    res.redirect("/admin/schedule");
  } catch (err) {
    console.error("Error updating schedule:", err);
    res.status(500).send("Error updating schedule");
  }
});


router.delete("/schedule/:id", isAdmin, async (req, res) => {
  await TestSchedule.findByIdAndDelete(req.params.id);
  res.redirect("/admin/schedule");
});


/*--Report--*/ 
router.get("/reports", isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    const results = await Result.find()
      .populate("userId")
      .populate("testId");

    // Fetch tests in correct order
    const tests = await Test.find().sort({ testNo: 1 });
    const testIndexMap = {};
    tests.forEach((test, index) => {
      testIndexMap[test._id.toString()] = index;
    });

    // Build user scores with proper alignment
    const usersMap = {};
    results.forEach(r => {
      if (!r.userId || !r.testId) return;

      if (!usersMap[r.userId._id]) {
        usersMap[r.userId._id] = {
          name:
            r.userId.studentName ||
            r.userId.username ||
            `${r.userId.firstName || ""} ${r.userId.lastName || ""}`,
          email: r.userId.email,
          scores: new Array(tests.length).fill(null)
        };
      }

      const testIndex = testIndexMap[r.testId._id.toString()];
      if (testIndex !== undefined) {
        usersMap[r.userId._id].scores[testIndex] = r.score;
      }
    });

    const usersArray = Object.values(usersMap);
    const maxTests = tests.length;

    // Calculate statistics
    const totalUsers = users.length;
    const totalTests = results.length;
    const totalMarksPerTest = 20; // Change if tests have different max marks
    const allScores = results.map(r => r.score || 0);
    const avgScore = allScores.length
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : 0;

    const scoreCategories = { good: 0, average: 0, poor: 0 };
    allScores.forEach(score => {
      const percentage = (score / totalMarksPerTest) * 100;
      if (percentage >= 70) scoreCategories.good++;
      else if (percentage >= 40) scoreCategories.average++;
      else scoreCategories.poor++;
    });

    res.render("admin/adminReport", {
      usersArray,
      maxTests,
      totalUsers,
      totalTests,
      avgScore,
      scoreDistribution: [
        scoreCategories.good,
        scoreCategories.average,
        scoreCategories.poor
      ]
    });
  } catch (err) {
    console.error("Error rendering report:", err);
    res.status(500).send("Internal Server Error");
  }
});



module.exports = router;
