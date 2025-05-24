const Review = require('../models/Review');
const Car = require('../models/Car');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/asyncHandler');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Public (for testing, should be Private in production)
exports.createReview = asyncHandler(async (req, res) => {
  const { carId, rating, comment, userId, userName } = req.body;

  // Check if car exists
  const car = await Car.findById(carId);
  if (!car) {
    return res.status(404).json({
      success: false,
      message: 'Car not found'
    });
  }

  // For authenticated users, get user info from token
  // For non-authenticated users (testing), use provided userId and userName
  let reviewUserId = userId;
  let reviewUserName = userName;
  let reviewUserImage = null;

  if (req.user) {
    // If authenticated, use the authenticated user's info
    const user = await User.findById(req.user.id);
    reviewUserId = req.user.id;
    reviewUserName = user ? (user.name || `${user.firstName} ${user.lastName}`) : 'Anonymous';
    reviewUserImage = user ? user.profileImage : null;
    
    // Check if user has already reviewed this car
    const existingReview = await Review.findOne({ userId: req.user.id, carId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this car'
      });
    }
  } else if (req.body.userImage) {
    // For non-authenticated users, use the provided image if available
    reviewUserImage = req.body.userImage;
  }

  // Create review
  const review = await Review.create({
    userId: reviewUserId,
    userName: reviewUserName,
    userImage: reviewUserImage,
    carId,
    rating,
    comment,
    date: new Date()
  });

  res.status(201).json({
    success: true,
    data: {
      review
    }
  });
});

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().sort('-date');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: {
      reviews
    }
  });
});

// @desc    Get reviews by car ID
// @route   GET /api/reviews/car/:carId
// @access  Public
exports.getReviewsByCarId = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ carId: req.params.carId }).sort('-date');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: {
      reviews
    }
  });
});

// @desc    Get reviews by user ID
// @route   GET /api/reviews/user/:userId
// @access  Private/Admin or Owner
exports.getReviewsByUserId = asyncHandler(async (req, res) => {
  // Only allow admin or the review owner to see user's reviews
  if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these reviews'
    });
  }

  const reviews = await Review.find({ userId: req.params.userId }).sort('-date');

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: {
      reviews
    }
  });
});

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private/Owner
exports.updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if review belongs to user or user is admin
  if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this review'
    });
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedAt: Date.now() },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: {
      review
    }
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Owner or Admin
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if review belongs to user or user is admin
  if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this review'
    });
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
