const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, 
    category: { type: String, required: true },  
    topic: { type: String, required: true },     
    level: { type: String, required: true, enum: ["Easy", "Medium", "Hard"] } 
}, { timestamps: true });

module.exports = mongoose.model("Question", QuestionSchema);
