const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');

router.post('/', mentorController.createMentor);
router.put('/:id', mentorController.editMentor);
router.get('/', mentorController.getAllMentors);
router.get('/count', mentorController.getMentorCount);
router.get('/:id', mentorController.getMentorById);
router.delete('/:id', mentorController.deleteMentor);
router.put('/:id/profilepic', mentorController.addMentorProfilePic);

module.exports = router;