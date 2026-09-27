const Result = require('../models/Result');
const Test = require('../models/Test');

/**
 * ✅ Utility function to calculate performance & feedback
 */
const calculatePerformance = (score, totalMarks) => {
  if (totalMarks === 0) {
    return {
      performance: "N/A",
      feedback: "No marks available to calculate performance."
    };
  }

  const percentage = (score / totalMarks) * 100;

  if (percentage >= 75) {
    return {
      performance: "Good",
      feedback: "Great work! Keep practicing advanced questions to strengthen your skills further."
    };
  } else if (percentage >= 40) {
    return {
      performance: "Average",
      feedback: "You’re doing fine, but try to revise weak topics and practice more questions."
    };
  } else {
    return {
      performance: "Poor",
      feedback: "Don't worry. Focus on basics, revise topics regularly, and practice easy-level problems first."
    };
  }
};

/**
 * ✅ Get all results (JSON)
 */
exports.getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("testId")
      .populate("userId");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error });
  }
};

/**
 * ✅ Get a single result by ID (JSON)
 */
exports.getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate("testId");
    if (!result) return res.status(404).json({ message: 'Result not found' });

    res.json(result); // includes stored performance & feedback
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result', error });
  }
};

/**
 * ✅ Render EJS result page
 */
exports.renderResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate("testId");
    if (!result) return res.render("user/testResult", { result: null });

    res.render("user/testResult", { result });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error rendering result page");
  }
};

/**
 * ✅ Create new result
 */
exports.createResult = async (req, res) => {
  try {
    let score = Number(req.body.score || 0);
    let totalMarks = Number(req.body.totalMarks || 0);

    // If totalMarks not provided, compute from test
    if (totalMarks === 0 && req.body.testId) {
      const testDoc = await Test.findById(req.body.testId);
      if (testDoc && testDoc.questions) {
        totalMarks = testDoc.questions.reduce((sum, q) => sum + (q.score || 1), 0);
      }
    }

    // Get performance & feedback
    const { performance, feedback } = calculatePerformance(score, totalMarks);

    const newResult = new Result({
      ...req.body,
      score,
      totalMarks,
      performance,
      feedback
    });

    await newResult.save();
    res.status(201).json(newResult);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating result', error });
  }
};

/**
 * ✅ Update existing result
 */
exports.updateResult = async (req, res) => {
  try {
    const resultDoc = await Result.findById(req.params.id);
    if (!resultDoc) return res.status(404).json({ message: 'Result not found' });

    // Apply updates
    Object.assign(resultDoc, req.body);

    // Recalculate performance if score/marks changed
    if ('score' in req.body || 'totalMarks' in req.body) {
      const { performance, feedback } = calculatePerformance(resultDoc.score, resultDoc.totalMarks);
      resultDoc.performance = performance;
      resultDoc.feedback = feedback;
    }

    await resultDoc.save();
    res.json(resultDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating result', error });
  }
};

/**
 * ✅ Delete a result
 */
exports.deleteResult = async (req, res) => {
  try {
    const deletedResult = await Result.findByIdAndDelete(req.params.id);
    if (!deletedResult) return res.status(404).json({ message: 'Result not found' });

    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting result', error });
  }
};

// Export helper for use in other controllers
exports.calculatePerformance = calculatePerformance;
