const express = require('express'); 
const router = express.Router();
const Contact = require('../models/Contact');

// Middleware to ensure admin access
const isAdmin = (req, res, next) => {
    if (req.session?.admin) {
        next();
    } else {
        res.status(403).render('error', {
            message: 'Access denied!',
            user: req.session?.user || null
        });
    }
};


// Admin view of contact messages
router.get('/manageContacts', isAdmin, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });

        res.render('admin/manageContacts', {
            admin: req.session.admin,
            messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            message: 'Failed to fetch contact messages',
            user: req.session?.user || null
        });
    }
});

// DELETE contact message by ID
router.delete('/manageContacts/:id', isAdmin, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.redirect('/admin/manageContacts');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', {
            message: 'Failed to delete message',
            user: req.session?.user || null
        });
    }
});

module.exports = router;
