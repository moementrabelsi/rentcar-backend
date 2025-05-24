const Booking = require('../models/Booking');
const Car = require('../models/Car');
const AdditionalService = require('../models/AdditionalService');
const { asyncHandler } = require('../middleware/asyncHandler');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, startDate, endDate, additionalServices } = req.body;

  // Check if vehicle exists and is available
  const vehicle = await Car.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ 
      success: false,
      message: 'Vehicle not found' 
    });
  }

  if (!vehicle.availability) {
    return res.status(400).json({ 
      success: false,
      message: 'Vehicle is not available for booking' 
    });
  }

  // Check for date conflicts with existing bookings
  const conflictingBooking = await Booking.findOne({
    vehicleId,
    status: { $in: ['pending', 'active'] },
    $or: [
      { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
      { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      { 
        $and: [
          { startDate: { $lte: new Date(startDate) } },
          { endDate: { $gte: new Date(endDate) } }
        ]
      }
    ]
  });

  if (conflictingBooking) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle is already booked for these dates'
    });
  }

  // Calculate rental duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Calculate base amount
  let totalAmount = vehicle.pricePerDay * durationInDays;

  // Process additional services
  let bookingAdditionalServices = [];
  if (additionalServices && additionalServices.length > 0) {
    const serviceIds = additionalServices.map(service => service.serviceId);
    const services = await AdditionalService.find({ _id: { $in: serviceIds } });
    
    bookingAdditionalServices = services.map(service => ({
      serviceId: service._id,
      name: service.name,
      price: service.price
    }));
    
    // Add service costs to total
    const additionalCost = services.reduce((sum, service) => sum + service.price, 0);
    totalAmount += additionalCost * durationInDays;
  }

  // Create booking
  const booking = await Booking.create({
    userId: req.user.id,
    vehicleId,
    startDate,
    endDate,
    totalAmount,
    additionalServices: bookingAdditionalServices,
    status: 'pending',
    paymentStatus: 'pending'
  });

  // Populate vehicle data for the response
  await booking.populate('vehicle');

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin for all, Private for user's own bookings
exports.getBookings = asyncHandler(async (req, res) => {
  const filter = {};

  // If not admin, only show user's own bookings
  if (req.user.role !== 'admin') {
    filter.userId = req.user.id;
  }

  const bookings = await Booking.find(filter)
    .populate('vehicleId', 'name brand model imageUrl')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('vehicleId', 'name brand model imageUrl');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking belongs to user or user is admin
  if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this booking'
    });
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  let booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if booking belongs to user or user is admin
  if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this booking'
    });
  }

  // Only admin can change any status
  // Customers can only cancel upcoming bookings
  if (req.user.role !== 'admin') {
    // Check if booking is in the future
    const currentDate = new Date();
    const bookingStartDate = new Date(booking.startDate);
    
    if (bookingStartDate <= currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify or cancel active or past bookings'
      });
    }
    
    // Customers can only cancel their bookings
    if (status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'You can only cancel your booking'
      });
    }
  }

  booking.status = status;
  booking.updatedAt = Date.now();
  
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = asyncHandler(async (req, res) => {
  // Only admin can delete bookings
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete bookings'
    });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  await booking.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
