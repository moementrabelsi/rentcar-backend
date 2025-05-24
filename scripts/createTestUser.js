require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'user@rentcar.com' });
    if (existingUser) {
      console.log('Test user already exists');
      console.log('Email: user@rentcar.com');
      console.log('Password: User123!');
      process.exit(0);
    }

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'user@rentcar.com',
      password: 'User123!',
      role: 'customer',
      isEmailVerified: true,
      phone: '1234567890',
      address: '123 Test St'
    });

    console.log('Test user created successfully');
    console.log('Email: user@rentcar.com');
    console.log('Password: User123!');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    process.exit(0);
  }
};

createTestUser();
