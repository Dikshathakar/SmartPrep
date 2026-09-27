const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    email: { type: String, unique: true},  // optional
    studentClass: { type: String, default: "Pending" }, 
    prn: { type: String, unique: true, required: true }, // login ID
    password: { type: String, required: true }
});

module.exports = mongoose.model("User", userSchema);
