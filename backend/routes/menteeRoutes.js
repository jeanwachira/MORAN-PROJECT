const express = require('express');
const router = express.Router();
const menteeController = require('../controllers/menteesController');

router.post('/', menteeController.createMentee);
router.put('/:id', menteeController.editMentee);
router.get('/', menteeController.getAllMentees);
router.get('/count', menteeController.getMenteeCount);
router.get('/:id', menteeController.getMenteeById);
router.delete('/:id', menteeController.deleteMentee);
router.put('/:id/profilepic', menteeController.addMenteeProfilePic);

module.exports = router;