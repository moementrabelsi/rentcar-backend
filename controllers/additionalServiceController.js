const AdditionalService = require('../models/AdditionalService');
const { asyncHandler } = require('../middleware/asyncHandler');

// @desc    Create a new additional service
// @route   POST /api/services
// @access  Private/Admin
exports.createService = asyncHandler(async (req, res) => {
  // Only admin can create services
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create services'
    });
  }

  const service = await AdditionalService.create(req.body);

  res.status(201).json({
    success: true,
    data: service
  });
});

// @desc    Get all additional services
// @route   GET /api/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
  const services = await AdditionalService.find({ isActive: true }).sort('name');

  res.status(200).json({
    success: true,
    count: services.length,
    data: services
  });
});

// @desc    Get single additional service
// @route   GET /api/services/:id
// @access  Public
exports.getService = asyncHandler(async (req, res) => {
  const service = await AdditionalService.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  res.status(200).json({
    success: true,
    data: service
  });
});

// @desc    Update additional service
// @route   PUT /api/services/:id
// @access  Private/Admin
exports.updateService = asyncHandler(async (req, res) => {
  // Only admin can update services
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update services'
    });
  }

  let service = await AdditionalService.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  service = await AdditionalService.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: service
  });
});

// @desc    Delete additional service
// @route   DELETE /api/services/:id
// @access  Private/Admin
exports.deleteService = asyncHandler(async (req, res) => {
  // Only admin can delete services
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete services'
    });
  }

  const service = await AdditionalService.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Soft delete by setting isActive to false
  service.isActive = false;
  await service.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});
