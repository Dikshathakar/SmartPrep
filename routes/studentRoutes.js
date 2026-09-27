// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const TestSchedule = require("../models/TestSchedule");

// Show test schedule to students
router.get("/schedule", async (req, res) => {
  try {
    const schedules = await TestSchedule.find().populate("tests.test");
    res.render("user/viewSchedule", { schedules });
  } catch (err) {
    console.error("Error fetching user schedule:", err);
    res.status(500).send("Error fetching schedule");
  }
});

module.exports = router;
