const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  score: { type: Number, default: 0 },
  totalMarks: { type: Number }, 
  performance: { type: String, enum: ['Poor', 'Average', 'Good', 'N/A'], default: 'N/A' },
  feedback: { type: String, default: '' },
  answers: { type: Object, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
