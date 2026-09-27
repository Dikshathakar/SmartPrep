const Test = require('../models/Test');
const Result = require('../models/Result'); // ✅ Required to use Result model


// ✅ Show Create Test Page
exports.getCreateTestPage = async (req, res) => {
  try {
    res.render("admin/createTest", {
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error("Error loading create test page:", err);
    res.status(500).send("Internal Server Error");
  }
};

// ✅ Create Test and Save
exports.postCreateTest = async (req, res) => {
  try {
    const questions = [];

    for (let i = 0; i < 20; i++) {
      questions.push({
        questionText: req.body[`questionText${i}`],
        options: [
          req.body[`option${i}_0`],
          req.body[`option${i}_1`],
          req.body[`option${i}_2`],
          req.body[`option${i}_3`]
        ],
        correctAnswer: parseInt(req.body[`correctAnswer${i}`])
      });
    }

    const newTest = new Test({
      title: req.body.title,
      questions: questions
    });

    await newTest.save();
    res.redirect("/admin/manageTests?success=true");

  } catch (err) {
    console.error("Error creating test:", err);
    res.status(500).send("Internal Server Error");
  }
};

// ✅ Manage Tests Page
exports.getManageTests = async (req, res) => {
  try {
    const tests = await Test.find({});
    res.render("admin/manageTests", {
      tests,
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error("Error loading tests:", err);
    res.status(500).send("Internal Server Error");
  }
};

// ✅ Delete Test
exports.postDeleteTest = async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.redirect("/admin/manageTests");
  } catch (err) {
    console.error("Error deleting test:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getEditResult = async (req, res) => {
    try {
        const result = await Result.findById(req.params.id)
            .populate('userId')
            .populate('testId');

        if (!result) {
            return res.redirect('/admin/viewResults?error=Result not found');
        }

        res.render('admin/editResult', {
            result,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/viewResults?error=Error loading result');
    }
};

exports.postEditResult = async (req, res) => {
    const { score } = req.body;

    try {
        const result = await Result.findById(req.params.id);

        if (!result) {
            return res.redirect('/admin/viewResults?error=Result not found');
        }

        result.score = score;
        await result.save();

res.redirect('/admin/result/add?success=Result updated successfully');
    } catch (err) {
        console.error(err);
res.redirect('/admin/result/add?error=Error updating result');
    }
};


