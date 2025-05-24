require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@rentcar.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@rentcar.com',
      password: 'Admin123!', // Change this password after first login
      role: 'admin',
      isEmailVerified: true
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@rentcar.com');
    console.log('Password: Admin123!');
    console.log('Please change the password after first login');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin(); 