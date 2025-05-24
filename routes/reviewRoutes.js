const express = require('express');
const router = express.Router();
const { 
  createReview,
  getReviews,
  getReview,
  updateReview,
  deleteReview,
  getReviewsByCarId,
  getReviewsByUserId
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (no authentication required)
// Get all reviews
router.route('/')
  .get(getReviews);

// Create a review (public for testing purposes)
router.route('/')
  .post(createReview);

// Get a specific review
router.route('/:id')
  .get(getReview);

// Get reviews by car
router.route('/car/:carId')
  .get(getReviewsByCarId);

// Routes that need authentication
router.use(protect);

// Protected routes (require authentication)
// Update and delete review
router.route('/:id')
  .put(updateReview)
  .delete(deleteReview);

// Get reviews by user (protected - only admin or the user themselves can see)
router.route('/user/:userId')
  .get(getReviewsByUserId);

module.exports = router;
