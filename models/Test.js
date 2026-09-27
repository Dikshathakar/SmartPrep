const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function (val) {
        return val.length === 4; 
      },
      message: 'Each question must have exactly 4 options'
    }
  },
  correctAnswer: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        return this.options.includes(value); 
      },
      message: 'Correct answer must be one of the provided options'
    }
  },
  score: {
    type: Number,
    default: 1 
  },
  topic: {
    type: String,
    required: true,
    default: "General" 
  },
  level: {
    type: String,
    required: true,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  category: {
    type: String,
    required: true,
    default: "Programming"
  }
});


const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    questions: [questionSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Test', testSchema);
