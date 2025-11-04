const express = require('express');
const router = express.Router();
const cohortController = require('../controllers/cohortController');

//app.use('/api/cohorts');
router.post('/', cohortController.createCohort);
router.put('/:id', cohortController.editCohort);
router.get('/', cohortController.getAllCohorts);
router.get('/count', cohortController.getCohortCount);
router.get('/:id', cohortController.getCohortById);
router.delete('/:id', cohortController.deleteCohort);

module.exports = router;
