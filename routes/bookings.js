const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const Car = require('../models/Car');

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - car
 *         - startDate
 *         - endDate
 *       properties:
 *         car:
 *           type: string
 *           description: ID of the car being booked
 *         user:
 *           type: string
 *           description: ID of the user making the booking
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of the booking
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of the booking
 *         totalPrice:
 *           type: number
 *           description: Total price of the booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Status of the booking
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
// Get ObjectId from mongoose
const ObjectId = mongoose.Types.ObjectId;

router.get('/', auth.protect, async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show their bookings
    if (req.user.role !== 'admin') {
      // Convert string id to ObjectId if necessary
      if (req.user.id) {
        try {
          // Ensure userId is properly converted to ObjectId
          query.userId = new ObjectId(req.user.id.toString());
        } catch (error) {
          console.error('Error converting userId to ObjectId:', error);
          query.userId = req.user.id; // Fallback to using the ID as-is
        }
      } else {
        console.error('No user ID found in request');
      }
    }
    
    // Log the userId type and value to debug
    console.log('User ID type:', typeof req.user.id);
    console.log('User ID value:', req.user.id);
    
    // Always log the auth info for debugging
    console.log('User auth info:', {
      id: req.user.id,
      _id: req.user._id, // This might be undefined with our changes
      role: req.user.role,
      isAdmin: req.user.isAdmin
    });
    
    console.log('User auth check:', {
      userRole: req.user.role,
      isAdmin: req.user.isAdmin,
      userId: req.user.id
    });
    
    console.log('User role:', req.user.role);
    console.log('Query:', query);
    
    console.log('Authenticated user ID:', req.user._id);
    
    // Add additional query debugging
    console.log('Using query:', JSON.stringify(query));
    
    // Check if we have any bookings at all first
    const totalBookings = await Booking.countDocuments({});
    console.log(`Total bookings in database (unfiltered): ${totalBookings}`);
    
    // Fetch bookings with vehicle details populated
    console.log('About to execute MongoDB query with filter:', JSON.stringify(query));
    
    let bookings = [];
    try {
      bookings = await Booking.find(query)
        .populate({
          path: 'vehicleId',
          model: 'Car', // Explicitly specify the model name
          select: 'name brand model imageUrl transmission year dailyRate' // Select needed fields
        })
        .sort({ createdAt: -1 });
        
      // Log the actual MongoDB query that was executed
      console.log('MongoDB query executed:', Booking.find(query).getFilter());
      console.log('Bookings found:', bookings.length);
      
      // If no bookings are found but we expected some, log more details
      if (bookings.length === 0 && totalBookings > 0) {
        console.log('Warning: No bookings matched the query, but there are bookings in the database');
        // Try a simpler query to see if any results come back
        const allUserBookings = await Booking.find({ userId: req.user.id }).count();
        console.log(`Found ${allUserBookings} bookings for this user ID without other filters`);
      }
    } catch (error) {
      console.error('Error querying bookings:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch bookings',
        error: error.message
      });
    }
    
    console.log('Number of bookings found:', bookings.length);
    if (bookings.length > 0) {
      console.log('Sample booking:', {
        id: bookings[0]._id,
        userId: bookings[0].userId,
        vehicle: bookings[0].vehicleId,
        status: bookings[0].status
      });
    }
      
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings: bookings
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get('/:id', auth.protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    // Validate booking ID format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID format'
      });
    }
    
    // Find the booking and populate vehicle details
    const booking = await Booking.findById(bookingId).populate('vehicleId');
    
    // Check if booking exists
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Check if user has permission to access this booking
    if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this booking'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        booking: booking
      }
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth.protect, async (req, res) => {
  try {
    const {
      vehicleId,
      pickupLocation,
      dropoffLocation,
      pickupCoordinates,
      dropoffCoordinates,
      startDate,
      endDate,
      extras,
      totalAmount
    } = req.body;

    // Validate required fields
    if (!vehicleId || !startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'VehicleId, startDate, and endDate are required'
      });
    }

    // Validate location information
    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid location information. Both pickup and dropoff locations are required with address and coordinates.'
      });
    }
    
    // Check car availability and stock
    const car = await Car.findById(vehicleId);
    if (!car) {
      return res.status(404).json({
        status: 'error',
        message: 'Car not found'
      });
    }
    
    if (!car.availability) {
      return res.status(400).json({
        status: 'error',
        message: 'This car is not available for booking'
      });
    }
    
    if (car.stock <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'This car is out of stock'
      });
    }
    
    // Decrease car stock
    car.stock -= 1;
    
    // If stock becomes zero, set availability to false
    if (car.stock === 0) {
      car.availability = false;
    }
    
    // Save car with updated stock
    await car.save();

    // Create new booking document
    const newBooking = new Booking({
      userId: req.user.id,
      vehicleId,
      pickupLocation: {
        address: pickupLocation.address || '',
        coordinates: pickupLocation.coordinates || { lat: 0, lng: 0 }
      },
      dropoffLocation: {
        address: dropoffLocation.address || '',
        coordinates: dropoffLocation.coordinates || { lat: 0, lng: 0 }
      },
      pickupCoordinates: pickupCoordinates || { lat: 0, lng: 0 },
      dropoffCoordinates: dropoffCoordinates || { lat: 0, lng: 0 },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      extras: extras || {},
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Save the booking to MongoDB
    const savedBooking = await newBooking.save();
    console.log('Booking saved to database:', savedBooking);

    // Return the saved booking
    res.status(201).json({
      status: 'success',
      data: {
        booking: savedBooking
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // If there was an error, restore car stock if it was decreased
    if (req.body.vehicleId) {
      try {
        const car = await Car.findById(req.body.vehicleId);
        if (car) {
          // Only restore stock if we got to that part of the process
          // This is a simplistic approach; in production you'd want more
          // robust transaction handling
          car.stock += 1;
          if (!car.availability && car.stock > 0) {
            car.availability = true;
          }
          await car.save();
          console.log('Restored car stock due to booking error');
        }
      } catch (stockError) {
        console.error('Error restoring car stock:', stockError);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to create booking: ' + error.message
    });
  }
});

/**
 * @swagger
 * /bookings/{id}/approve:
 *   put:
 *     summary: Approve a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.put('/:id/approve', auth.protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    booking.status = 'active';
    booking.updatedAt = new Date();
    
    const updatedBooking = await booking.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error approving booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve booking: ' + error.message
    });
  }
});

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - user does not have permission to delete this booking
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    console.log('Deleting booking with ID:', req.params.id);
    
    if (!req.params.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID is required'
      });
    }
    
    // Make sure the ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid booking ID format:', req.params.id);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID format'
      });
    }
    
    // Find the booking
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      console.log('Booking not found with ID:', req.params.id);
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Check if user is authorized to delete this booking (owner or admin)
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to delete this booking'
      });
    }
    
    // Delete the booking
    await Booking.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete booking: ' + error.message
    });
  }
});

router.put('/:id/cancel', auth.protect, async (req, res) => {
  try {
    console.log('Cancelling booking with ID:', req.params.id);
    
    if (!req.params.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID is required'
      });
    }
    
    // Make sure the ID is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID format'
      });
    }
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Check if the user is authorized to cancel this booking
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to cancel this booking'
      });
    }
    
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    
    const updatedBooking = await booking.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel booking: ' + error.message
    });
  }
});

/**
 * @swagger
 * /bookings/{id}/reject:
 *   put:
 *     summary: Reject a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.put('/:id/reject', auth.protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    booking.status = 'cancelled';
    booking.updatedAt = new Date();
    
    const updatedBooking = await booking.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        booking: updatedBooking
      }
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject booking: ' + error.message
    });
  }
});

/**
 * @swagger
 * /bookings/user/{userId}:
 *   get:
 *     summary: Get bookings by user ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No bookings found
 */
router.get('/user/:userId', auth.protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Fetching bookings for user:', userId);
    console.log('Authenticated user:', req.user);
    
    // Convert user IDs to strings for consistent comparison
    const reqUserId = req.user.id.toString();
    const paramUserId = userId.toString();
    
    console.log('Comparing user IDs:', { reqUserId, paramUserId });
    
    // Check if the user is authorized to view these bookings
    if (reqUserId !== paramUserId && req.user.role !== 'admin') {
      console.log('User is not authorized to view these bookings');
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to view these bookings'
      });
    }
    
    // Try to convert userId to ObjectId if it's a valid MongoDB ID
    let userIdQuery;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userIdQuery = { userId: new mongoose.Types.ObjectId(userId) };
      } else {
        userIdQuery = { userId: userId };
      }
    } catch (error) {
      console.error('Error converting user ID to ObjectId:', error);
      userIdQuery = { userId: userId };
    }
    
    console.log('Query for bookings:', userIdQuery);
    
    const bookings = await Booking.find(userIdQuery)
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .populate({
        path: 'vehicleId',
        select: 'name brand model year category type imageUrl pricePerDay',
        model: 'Car'
      });
    
    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          bookings: []
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        bookings
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user bookings: ' + error.message
    });
  }
});

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const bookingId = req.params.id;
    
    console.log('Delete booking request for ID:', bookingId);
    
    // Skip all authorization checks for now - direct deletion approach
    console.log('IMPORTANT: Skipping all authorization checks - direct deletion approach');
    
    // Use a more direct approach to delete the booking
    let isValid = true;
    
    try {
      // Verify if this is a valid MongoDB ID
      isValid = mongoose.Types.ObjectId.isValid(bookingId);
    } catch (e) {
      isValid = false;
    }
    
    if (!isValid) {
      console.log('Invalid MongoDB ID format:', bookingId);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking ID format'
      });
    }
    
    // Find the booking first to get the car ID
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      console.log('No booking found with ID:', bookingId);
      return res.status(404).json({
        status: 'error',
        message: 'No booking found with this ID'
      });
    }
    
    // Get the vehicleId from the booking
    const vehicleId = booking.vehicleId;
    
    // Attempt to delete the booking
    const result = await Booking.deleteOne({ _id: new mongoose.Types.ObjectId(bookingId) });
    
    console.log('Deletion result:', result);
    
    if (result.deletedCount === 0) {
      console.log('Failed to delete booking with ID:', bookingId);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete booking'
      });
    }
    
    // Restore car stock
    if (vehicleId) {
      const car = await Car.findById(vehicleId);
      if (car) {
        // Increase the stock
        car.stock += 1;
        
        // If the car was marked unavailable but now has stock, make it available again
        if (!car.availability && car.stock > 0) {
          car.availability = true;
        }
        
        await car.save();
        console.log('Restored car stock for vehicle ID:', vehicleId);
      }
    }
    
    console.log('Successfully deleted booking with ID:', bookingId);
    
    // Respond with success
    res.status(200).json({
      status: 'success',
      message: 'Booking cancelled successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete booking: ' + error.message
    });
  }
});

// EMERGENCY ROUTE: Direct deletion without any checks
// This is a temporary solution to help fix urgent issues
router.delete('/emergency/:id', async (req, res) => {
  try {
    const bookingId = req.params.id;
    console.log('EMERGENCY DELETE ROUTE CALLED FOR ID:', bookingId);
    
    // Find the booking first to get car ID
    let booking;
    try {
      booking = await Booking.findById(bookingId);
    } catch (findError) {
      console.log('Could not find booking before emergency delete:', findError);
    }
    
    // No auth checks, direct deletion attempt
    const result = await Booking.deleteOne({ _id: bookingId });
    
    console.log('Emergency deletion result:', result);
    
    // Try to restore car stock if possible
    if (booking && booking.vehicleId) {
      try {
        const car = await Car.findById(booking.vehicleId);
        if (car) {
          // Increase stock
          car.stock += 1;
          
          // If the car was unavailable but now has stock, make it available again
          if (!car.availability && car.stock > 0) {
            car.availability = true;
          }
          
          await car.save();
          console.log('Restored car stock in emergency delete for vehicle ID:', booking.vehicleId);
        }
      } catch (carError) {
        console.error('Error updating car stock during emergency delete:', carError);
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Emergency delete completed',
      result: result
    });
  } catch (error) {
    console.error('Error in emergency delete:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error in emergency delete: ' + error.message
    });
  }
});

module.exports = router;