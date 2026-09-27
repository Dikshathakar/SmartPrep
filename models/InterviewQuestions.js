const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true, unique: true },
  company: { type: String, required: true },
  source: { type: String, required: true }
});

const InterviewQuestions = mongoose.model('InterviewQuestions', interviewQuestionSchema);

module.exports = InterviewQuestions;
