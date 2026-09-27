const express = require('express');
const router = express.Router();
const csrf = require('csurf');
const csrfProtection = csrf();

const Test = require('../models/Test');
const Result = require('../models/Result'); // ✅ Add this to check submissions
const { verifyAdmin } = require('../middleware/adminAuth');
const { verifyUser } = require('../middleware/auth');
const { submitTest } = require('../controllers/testController');

// ➤ Admin creates a test
router.post('/admin/createTest', verifyAdmin, csrfProtection, async (req, res) => {
    try {
        const newTest = new Test({
            title: req.body.title,
            questions: req.body.questions || [],
            createdBy: req.admin.id
        });
        await newTest.save();
        res.redirect('/admin/adminDashboard');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating test');
    }
});

// Redirect /test → /test/list
router.get('/', (req, res) => {
    res.redirect('/test/list');
});

// ➤ User views test list
router.get('/list', verifyUser, async (req, res) => {
    try {
        const tests = await Test.find().select('_id title');
        const userId = req.session.user._id;

        // ✅ Fetch which tests this user has already submitted
        const submittedResults = await Result.find({ user: userId }).select('test');
        const submittedTestIds = submittedResults.map(result => result.test.toString());

        // ✅ Add `alreadySubmitted` flag to each test
        const updatedTests = tests.map(test => ({
            _id: test._id,
            title: test.title,
            alreadySubmitted: submittedTestIds.includes(test._id.toString())
        }));

        res.render('user/testList', {
            user: req.session.user,
            tests: updatedTests
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading test list');
    }
});

// ➤ User takes test
router.get('/take/:id', verifyUser, csrfProtection, async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).send('Test not found');

        res.render('user/test', {
            test,
            user: req.session.user,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading test');
    }
});

// ➤ Submit test (POST)
router.post('/submit', verifyUser, csrfProtection, submitTest);

// ➤ Admin deletes a test
router.delete('/:id', verifyAdmin, csrfProtection, async (req, res) => {
    try {
        await Test.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting test');
    }
});

module.exports = router;
