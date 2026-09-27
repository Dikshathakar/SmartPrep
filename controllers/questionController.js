const Question = require("../models/Question");

exports.createQuestion = async (req, res) => {
    try {
        const { questionText, options, correctAnswer, category } = req.body;
        const question = new Question({ questionText, options, correctAnswer, category });
        await question.save();
        res.status(201).json({ success: true, question });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getQuestions = async (req, res) => {
    try {
        const questions = await Question.find();
        res.status(200).json({ success: true, questions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        await Question.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

