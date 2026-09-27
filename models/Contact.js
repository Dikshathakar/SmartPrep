const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String,
    date: {
        type: Date,
        default: Date.now // ✅ adds date automatically
    }
});

module.exports = mongoose.model('Contact', contactSchema);
