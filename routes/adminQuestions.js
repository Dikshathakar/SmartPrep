const path = require('path');
const express = require('express');
const router = express.Router();
const AdminInterviewBank = require('../models/AdminInterviewBank'); 
const multer = require('multer');
const fs = require('fs');
const xlsx = require('xlsx');

const upload = multer({ dest: 'uploads/' });

// GET: Excel Upload Form
router.get('/uploadInterviewExcel', (req, res) => {
    res.render('admin/uploadInterviewExcel', {
        csrfToken: res.locals.csrfToken,
        success: req.query.success,
        error: req.query.error
    });
});

// Mapping for normalization
const normalizeValue = (value, map) => {
  if (!value) return value;
  const cleaned = value.trim().toLowerCase();
  return map[cleaned] || value; // fallback to original if not found
};

// Allowed mappings
const categoryMap = {
  'technical': 'technical',
  'programming': 'programming',
  'aptitude': 'aptitude'
};

const subcategoryMap = {
  'python': 'python',
  'c': 'c',
  'data structures': 'data structures',
  'java': 'java',
  'database': 'database'
};

const typeMap = {
  'recentlyasked': 'recentlyAsked',
  'frequentlyasked': 'frequentlyAsked'
};

// POST: Handle Excel Upload
router.post('/uploadInterviewExcel', upload.single('file'), async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const questions = data.map(row => ({
      company: row.company?.trim(),
      category: normalizeValue(row.category, categoryMap),
      subcategory: normalizeValue(row.subcategory, subcategoryMap),
      type: normalizeValue(row.type, typeMap),
      question: row.question?.trim(),
      answer: row.answer?.trim()
    }));

    // Insert into DB
    await AdminInterviewBank.insertMany(questions);

    fs.unlinkSync(filePath); // delete temp file

    // ✅ Redirect back with success query param
    res.redirect('/admin/uploadInterviewExcel?success=Excel uploaded and data saved successfully');
  } catch (err) {
    console.error('Error processing Excel:', err);

    // ✅ Redirect back with error query param
    res.redirect('/admin/uploadInterviewExcel?error=Failed to upload Excel file');
  }
});


// GET: Add Interview Question Page
router.get('/addInterviewQuestions', (req, res) => {
    res.render('admin/addInterviewQuestions', {
        csrfToken: res.locals.csrfToken,
        success: req.query.success,
        error: req.query.error
    });
});

// POST: Add Interview Question
router.post('/add', async (req, res) => {
    const { company, category, subcategory, type, question, answer } = req.body;

    try {
        if ((category === 'technical' || category === 'programming') && !subcategory) {
            return res.redirect('/admin/addInterviewQuestions?error=Subcategory+is+required+for+technical+or+programming+questions');
        }

        const newQuestion = new AdminInterviewBank({
            company,
            category,
            subcategory: (category === 'aptitude') ? undefined : subcategory,
            type,
            question,
            answer,
            addedBy: 'admin'
        });

        await newQuestion.save();
        return res.redirect('/admin/addInterviewQuestions?success=Question+added+successfully');
    } catch (error) {
        return res.redirect('/admin/addInterviewQuestions?error=Error+adding+question');
    }
});

// GET: Admin question list
router.get('/questions', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const questions = await AdminInterviewBank.find(filter);

        res.render('admin/questionsList', {
            questions,
            csrfToken: res.locals.csrfToken,
            selectedCategory: category || '',
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        res.render('admin/questionsList', {
            questions: [],
            csrfToken: res.locals.csrfToken,
            selectedCategory: '',
            error: 'Failed to load questions'
        });
    }
});

// GET: Edit question form
router.get('/questions/edit/:id', async (req, res) => {
    try {
        const question = await AdminInterviewBank.findById(req.params.id);
        res.render('admin/editQuestion', {
            csrfToken: res.locals.csrfToken,
            question,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        res.status(500).render('error', { message: 'Failed to load question.' });
    }
});

// POST: Update question
router.post('/questions/edit/:id', async (req, res) => {
    const { company, category, subcategory, type, question, answer } = req.body;
    try {
        await AdminInterviewBank.findByIdAndUpdate(req.params.id, {
            company,
            category,
            subcategory,
            type,
            question,
            answer
        });
        res.redirect(`/admin/questions/edit/${req.params.id}?success=${encodeURIComponent('Question updated successfully!')}`);
    } catch (err) {
        console.error(err);
        res.redirect(`/admin/questions/edit/${req.params.id}?error=${encodeURIComponent('Error updating question.')}`);
    }
});

// POST: Delete question
router.post('/questions/delete/:id', async (req, res) => {
    try {
        await AdminInterviewBank.findByIdAndDelete(req.params.id);
        res.redirect('/admin/questions?success=Question deleted successfully');
    } catch (err) {
        console.error(err);
        res.redirect('/admin/questions?error=Failed to delete question');
    }
});

module.exports = router;
