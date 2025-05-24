const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the car'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Please provide the car brand'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Please provide the car model'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Please provide the car year']
  },
  category: {
    type: String,
    required: [true, 'Please provide the car category'],
    enum: ['economy', 'compact', 'midsize', 'luxury', 'suv', 'van', 'sports']
  },
  type: {
    type: String,
    required: [true, 'Please provide the car type'],
    enum: ['sedan', 'hatchback', 'suv', 'crossover', 'coupe', 'convertible', 'minivan', 'pickup']
  },
  transmission: {
    type: String,
    required: [true, 'Please provide the transmission type'],
    enum: ['automatic', 'manual']
  },
  fuelType: {
    type: String,
    required: [true, 'Please provide the fuel type'],
    enum: ['petrol', 'diesel', 'electric', 'hybrid']
  },
  seats: {
    type: Number,
    required: [true, 'Please provide the number of seats'],
    min: 2,
    max: 8
  },
  pricePerDay: {
    type: Number,
    required: [true, 'Please provide the price per day'],
    min: 0
  },
  photos: [{
    type: String,
    required: [true, 'Please provide at least one photo']
  }],
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  features: [{
    type: String
  }],
  availability: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    required: [true, 'Please provide the car location']
  },
  mileage: {
    type: Number,
    required: [true, 'Please provide the car mileage']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numberOfReviews: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 1,
    min: 0,
    required: [true, 'Please provide stock quantity']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  carDirName: {
    type: String,
    trim: true
  }
});

// Update the updatedAt field before saving
carSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Car', carSchema); 