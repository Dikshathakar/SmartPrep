const express = require('express');
const router = express.Router();
const InterviewQuestions = require('../models/InterviewQuestions');
const SearchHistory = require('../models/SearchHistory');

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user && req.session.user.email) {
        return next();
    } else {
        return res.redirect('/signin');
    }
}

// Main chatbot page
router.get("/", isAuthenticated, async (req, res) => {
    try {
        const history = await SearchHistory.find({ userId: req.session.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        res.render('user/chatbot', { history, user: req.session.user });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.render('user/chatbot', { history: [], user: req.session.user });
    }
});

// Chatbot search
router.post('/chatbot-search', isAuthenticated, async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const results = await InterviewQuestions.find({
            $or: [
                { title: { $regex: message, $options: 'i' } },
                { company: { $regex: message, $options: 'i' } },
                { source: { $regex: message, $options: 'i' } }
            ]
        }).limit(10);

        if (results.length === 0) {
            return res.json({ reply: `❌ No results found for "${message}".` });
        }

        const bestMatchCompany = results[0].company;
        const reply = `📘 Interview questions for *${bestMatchCompany}*:\n` +
            results.map(q => `🔹 ${q.link}`).join('\n');

        res.json({ reply });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
