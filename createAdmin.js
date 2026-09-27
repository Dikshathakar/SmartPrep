const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admins');

mongoose.connect('mongodb://127.0.0.1:27017/SmartPrepManagerDB')
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('admin@123', 10); 
    const admin = new Admin({ email: 'admin@gmail.com', password: hashedPassword });

    await admin.save();
    console.log('Admin created successfully');
    mongoose.connection.close();
}

createAdmin();
