const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');

// Get recent activities with pagination
router.get('/', activityController.getRecentActivities);

// Get activities by entity type (e.g., Mentee, Cohort, Event)
router.get('/entity/:entityType', activityController.getActivitiesByEntity);

// Get activities for a specific entity
router.get('/entity/:entityType/:entityId', activityController.getActivitiesForEntity);

// Delete old activities (cleanup - you might want to protect this route)
router.delete('/cleanup', activityController.deleteOldActivities);

module.exports = router;