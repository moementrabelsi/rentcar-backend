const express = require('express');
const router = express.Router();
const userActivityController = require('../controllers/userActivityController');
const auth = require('../middleware/auth');

// Protect all routes in this router
router.use(auth.protect);

// Get authenticated user's activities
router.get('/me', userActivityController.getUserActivities);

// Admin routes
router.get('/all', auth.restrictTo('admin'), userActivityController.getAllActivities);

// Get specific user's activities (admin access or own user)
router.get('/:userId', userActivityController.getUserActivities);

module.exports = router;
