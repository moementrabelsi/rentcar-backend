const express = require('express');
const router = express.Router();
const userImageController = require('../controllers/userImageController');
const auth = require('../middleware/auth');

// Protect all routes in this router
router.use(auth.protect);

// Upload profile image
router.post('/upload', userImageController.uploadProfileImage, userImageController.saveProfileImage);

// Get user's profile image
router.get('/me', userImageController.getProfileImage);

// Get specific user's profile image (admin or own user)
router.get('/:userId', userImageController.getProfileImage);

module.exports = router;
