const User = require('../models/User');
const { createActivity } = require('./userActivityController');
const fs = require('fs');
const path = require('path');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with user ID and timestamp
    const userId = req.user._id;
    const fileExtension = path.extname(file.originalname);
    const fileName = `user_${userId}_${Date.now()}${fileExtension}`;
    
    cb(null, fileName);
  }
});

// Filter for image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to handle single file upload
exports.uploadProfileImage = upload.single('profileImage');

// Upload profile image controller
exports.saveProfileImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }

  // Get user and update profile image
  const user = await User.findById(req.user._id);
  
  // If user already has a profile image, delete the old one
  if (user.profileImage) {
    try {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    } catch (err) {
      console.error('Error deleting old profile image:', err);
      // Don't stop the process if old image deletion fails
    }
  }
  
  // Update user with new profile image path
  const imagePath = path.join('uploads/profile', req.file.filename).replace(/\\/g, '/');
  user.profileImage = imagePath;
  await user.save();
  
  // Log activity
  await createActivity(
    user._id, 
    'profile_update', 
    'Profile image updated', 
    { imageFile: req.file.filename }
  );

  res.status(200).json({
    status: 'success',
    message: 'Profile image updated successfully',
    data: {
      profileImage: imagePath
    }
  });
});

// Get profile image controller
exports.getProfileImage = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user._id;
  
  // Make sure users can only access their own profile image unless admin
  if (req.user.role !== 'admin' && req.user._id.toString() !== userId.toString()) {
    return next(new AppError('You do not have permission to access this profile image', 403));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.profileImage) {
    return next(new AppError('User has no profile image', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      profileImage: user.profileImage
    }
  });
});
