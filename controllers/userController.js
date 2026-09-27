const Result = require('../models/Result');
const Test = require('../models/Test');

exports.postSubmitTest = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { testId, answers } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).send("Test not found");

    let score = 0;
    const totalQuestions = test.questions.length;

    test.questions.forEach((q) => {
      const userAnswer = answers[q._id]; // user's selected option string
      const correctOption = q.options[q.correctAnswer]; // correct option string

      if (userAnswer === correctOption) {
        score += 1;
      }
    });

    const result = new Result({
      userId,
      testId,
      answers,
      score,
      totalMarks: totalQuestions,
      submittedAt: new Date()
    });

    await result.save();
    res.redirect(`/user/result/${result._id}`);
  } catch (err) {
    console.error("Error submitting test:", err);
    res.status(500).send("Server Error");
  }
};

