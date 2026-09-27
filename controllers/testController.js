const Test = require('../models/Test');
const Result = require('../models/Result');
const { calculatePerformance } = require('./resultController'); // ✅ import helper

// ✅ POST: Submit test and redirect to latest result page
exports.submitTest = async (req, res) => {
  try {
    const { testId, answers } = req.body;
    const userId = req.session.user._id;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    let score = 0;
    const formattedAnswers = {};

    test.questions.forEach((q) => {
      const rawAnswer = answers[q._id];
      if (rawAnswer !== undefined && rawAnswer !== null) {
        const selectedIndex = parseInt(rawAnswer);
        formattedAnswers[q._id] = selectedIndex;

        if (selectedIndex === parseInt(q.correctAnswer)) {
          score++;
        }
      }
    });

    await Result.create({
      userId,
      testId,
      score,
      totalMarks: test.questions.length,
      answers: formattedAnswers,
      submittedAt: new Date()
    });

    res.redirect(`/user/result/latest`);
  } catch (error) {
    console.error("❌ Error in submitTest:", error);
    res.status(500).json({ error: 'Error submitting test' });
  }
};

/* ✅ POST: Submit test and redirect to specific result page
exports.postSubmitTest = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { testId, answers } = req.body;

    const test = await Test.findById(testId);
    if (!test) return res.status(404).send("Test not found");

    let score = 0;
    const formattedAnswers = {};

    test.questions.forEach((q) => {
      const rawAnswer = answers[q._id];
      if (rawAnswer !== undefined && rawAnswer !== null) {
        const selectedIndex = parseInt(rawAnswer);
        formattedAnswers[q._id] = selectedIndex;

        if (selectedIndex === parseInt(q.correctAnswer)) {
          score++;
        }
      }
    });

    const result = new Result({
      userId,
      testId,
      score,
      totalMarks: test.questions.length,
      answers: formattedAnswers,
      submittedAt: new Date()
    });

    await result.save();

    // 👇 Redirect to view individual result (used by /submit-test)
    res.redirect(`/user/result/${result._id}`);
  } catch (err) {
    console.error("❌ Error in postSubmitTest:", err);
    res.status(500).send("Server Error");
  }
};

*/

exports.postSubmitTest = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const testId = req.body.testId;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).render("error", { message: "Test not found" });
    }

    const answers = {};
    let score = 0;

    test.questions.forEach((q) => {
      let submittedAnswer = req.body.answers[q._id];

      if (submittedAnswer !== undefined && submittedAnswer !== null) {
        submittedAnswer = submittedAnswer.toString().trim();
        answers[q._id] = submittedAnswer;

        if (submittedAnswer === q.correctAnswer.toString().trim()) {
          score++;
        }
      } else {
        answers[q._id] = null; // unanswered
      }
    });

    const totalMarks = test.questions.length;

    // ✅ Performance & feedback
    const { performance, feedback } = calculatePerformance(score, totalMarks);

    // Save result
    const result = new Result({
      userId,
      testId,
      score,
      totalMarks,
      performance,
      feedback,
      answers,
      submittedAt: new Date()
    });

    await result.save();

    res.redirect("/user/result/" + result._id);
  } catch (err) {
    console.error("❌ Error submitting test:", err);
    res.status(500).render("error", { message: "Failed to submit test" });
  }
};