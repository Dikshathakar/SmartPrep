// models/TestSchedule.js
const mongoose = require("mongoose");

const testSlotSchema = new mongoose.Schema({
  testNo: { type: Number, required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
  type: { type: String, required: true },
  subtype: { type: String, required: true },
  marks: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true }
});

const testScheduleSchema = new mongoose.Schema({
  examDate: { type: Date, required: true },
  tests: [testSlotSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TestSchedule", testScheduleSchema);
