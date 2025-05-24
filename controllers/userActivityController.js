const UserActivity = require('../models/UserActivity');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Helper function to create user activity
exports.createActivity = async (userId, type, description, details = {}) => {
  try {
    return await UserActivity.create({
      userId,
      type,
      description,
      details
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error - activity logging should not disrupt main flow
    return null;
  }
};

// Get user activities (for specific user)
exports.getUserActivities = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user._id;
  
  // Make sure users can only access their own activities unless admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== userId.toString()) {
    return next(new AppError('You do not have permission to access these activities', 403));
  }

  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const activities = await UserActivity.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const total = await UserActivity.countDocuments({ userId });

  res.status(200).json({
    status: 'success',
    data: {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get all activities (admin only)
exports.getAllActivities = catchAsync(async (req, res, next) => {
  // Ensure user is admin
  if (req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to access these activities', 403));
  }

  const limit = parseInt(req.query.limit) || 20;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const activities = await UserActivity.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
    
  const total = await UserActivity.countDocuments();

  res.status(200).json({
    status: 'success',
    data: {
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  });
});
