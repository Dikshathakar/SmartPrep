const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController'); 

// JSON APIs
router.get('/', resultController.getAllResults);             // Get all results
router.get('/:id', resultController.getResultById);          // Get single result JSON
router.post('/', resultController.createResult);             // Create result
router.put('/:id', resultController.updateResult);           // Update result
router.delete('/:id', resultController.deleteResult);        // Delete result

// Render EJS result page
router.get('/view/:id', resultController.renderResultById);

module.exports = router;
