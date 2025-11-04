const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventsController');

router.post('/', eventController.createEvent);
router.put('/:id', eventController.editEvent);
router.get('/', eventController.getAllEvents);
router.get('/count', eventController.getEventCount);
router.get('/:id', eventController.getEventById);
router.delete('/:id', eventController.deleteEvent);


module.exports = router;
