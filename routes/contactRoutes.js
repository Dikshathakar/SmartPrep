const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// GET form for guests or users
router.get('/', (req, res) => {
    const view = req.session.user ? 'user/contactus' : 'contactus';

    const success = req.session.success || null; // Get and clear success message
    delete req.session.success;

    res.render(view, {
        csrfToken: req.csrfToken(),
        user: req.session?.user || null,
        success // <-- pass it!
    });
});



router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).send(`
                <script>alert('Name, Email and Message are required!');
                window.history.back();</script>
            `);
        }

        await new Contact({ name, email, phone, message }).save();

        return res.send(`
            <script>alert('Message sent successfully!');
            window.location.href = '/';</script>
        `);
    } catch (error) {
        console.error(error);
        return res.status(500).send(`
            <script>alert('Server error occurred!');
            window.history.back();</script>
        `);
    }
});

module.exports = router;
