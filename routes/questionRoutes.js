const express = require("express");
const { createQuestion, getQuestions, deleteQuestion } = require("../controllers/questionController");
const router = express.Router();

// Create a new question
router.post("/questions", createQuestion);

// Get all questions
router.get("/questions", getQuestions);

// Delete a question
router.delete("/questions/:id", deleteQuestion);

module.exports = router;


