const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: {
    type: String, // Changed from ObjectId to String for testing purposes
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: null
  },
  carId: {
    type: String, // Changed from ObjectId to String for testing purposes
    ref: 'Car',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent user from submitting more than one review per car
ReviewSchema.index({ userId: 1, carId: 1 }, { unique: true });

// Update car's average rating after review is saved or deleted
ReviewSchema.statics.getAverageRating = async function(carId) {
  console.log(`Updating review stats for car: ${carId}`);
  
  try {
    // Find all reviews for this car
    const reviews = await this.find({ carId: carId });
    const reviewCount = reviews.length;
    
    // Calculate average rating
    let avgRating = 0;
    if (reviewCount > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      avgRating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to 1 decimal place
    }
    
    console.log(`Car ${carId}: Found ${reviewCount} reviews, average rating: ${avgRating}`);
    
    // Update the car document
    await mongoose.model('Car').findByIdAndUpdate(carId, {
      rating: avgRating,
      numberOfReviews: reviewCount
    });
    
    console.log(`Updated car ${carId} with ${reviewCount} reviews and rating ${avgRating}`);
  } catch (err) {
    console.error('Error updating car rating:', err);
  }
};

// Call getAverageRating after save
ReviewSchema.post('save', async function() {
  console.log(`Review saved for car ${this.carId}, updating stats...`);
  await this.constructor.getAverageRating(this.carId);
});

// Call getAverageRating after remove
ReviewSchema.post('remove', async function() {
  console.log(`Review removed for car ${this.carId}, updating stats...`);
  await this.constructor.getAverageRating(this.carId);
});

// Call getAverageRating after findOneAndUpdate
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    console.log(`Review updated for car ${doc.carId}, updating stats...`);
    await mongoose.model('Review').getAverageRating(doc.carId);
  }
});

// Call getAverageRating after findOneAndDelete
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    console.log(`Review deleted for car ${doc.carId}, updating stats...`);
    await mongoose.model('Review').getAverageRating(doc.carId);
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
