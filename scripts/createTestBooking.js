require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

const createTestBooking = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@rentcar.com' });
    if (!adminUser) {
      console.log('Admin user not found. Please run createAdmin.js first.');
      return;
    }

    // Find a vehicle
    const vehicle = await Vehicle.findOne();
    if (!vehicle) {
      console.log('No vehicles found in database. Please create at least one vehicle first.');
      return;
    }

    // Check if test booking already exists
    const existingBooking = await Booking.findOne({ 
      userId: adminUser._id,
      vehicleId: vehicle._id 
    });

    if (existingBooking) {
      console.log('Test booking already exists:');
      console.log(existingBooking);
      process.exit(0);
    }

    // Create booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3); // 3 days rental

    const testBooking = await Booking.create({
      userId: adminUser._id,
      vehicleId: vehicle._id,
      startDate: startDate,
      endDate: endDate,
      pickupLocation: {
        address: "123 Test Street, Test City",
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      dropoffLocation: {
        address: "123 Test Street, Test City",
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      status: "pending",
      totalAmount: vehicle.pricePerDay * 3,
      paymentStatus: "unpaid",
      extras: {
        insurance: true,
        childSeat: false,
        gps: true
      }
    });

    console.log('Test booking created successfully:');
    console.log(testBooking);

  } catch (error) {
    console.error('Error creating test booking:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    process.exit(0);
  }
};

createTestBooking();
