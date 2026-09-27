const mongoose = require('mongoose');

const adminInterviewBankSchema = new mongoose.Schema({
  company: { type: String, required: true },
  category: { type: String, enum: ['technical', 'programming', 'aptitude'], required: true },
  subcategory: { type: String, enum: ['python', 'c', 'data structures', 'java', 'database'] },
  type: { type: String, enum: ['recentlyAsked', 'frequentlyAsked'], required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true }, 
  addedBy: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminInterviewBank', adminInterviewBankSchema);
