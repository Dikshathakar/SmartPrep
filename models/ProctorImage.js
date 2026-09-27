const mongoose = require("mongoose");

const proctorSchema = new mongoose.Schema({
    testId: String,
    image: String, // base64 image
    timestamp: Date
});

module.exports = mongoose.model("ProctorImage", proctorSchema);
