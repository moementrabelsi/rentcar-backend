const mongoose = require('mongoose');

const coordinatesSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
}, { _id: false });

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    trim: true
  },
  coordinates: coordinatesSchema
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  pickupCoordinates: coordinatesSchema,
  dropoffCoordinates: coordinatesSchema,
  extras: {
    type: Object,
    default: {}
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A booking must belong to a user']
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: [true, 'A booking must be for a vehicle']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please provide the total amount']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  additionalServices: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdditionalService'
    },
    name: String,
    price: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual populate to get vehicle information when querying for bookings
bookingSchema.virtual('vehicle', {
  ref: 'Car',
  localField: 'vehicleId',
  foreignField: '_id',
  justOne: true
});

// Index for faster queries
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });

// Update the updatedAt field before saving
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate that endDate is after startDate
bookingSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
