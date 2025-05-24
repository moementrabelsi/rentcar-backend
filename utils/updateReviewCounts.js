const mongoose = require('mongoose');
const Review = require('../models/Review');
const Car = require('../models/Car');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Function to update review counts for all cars
const updateReviewCounts = async () => {
  try {
    console.log('Starting review count update...');
    
    // Get all cars
    const cars = await Car.find();
    console.log(`Found ${cars.length} cars to process`);
    
    // Process each car
    for (const car of cars) {
      // Count reviews for this car
      const reviewCount = await Review.countDocuments({ carId: car._id });
      
      // Calculate average rating if there are reviews
      let avgRating = 0;
      if (reviewCount > 0) {
        const reviews = await Review.find({ carId: car._id });
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        avgRating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to 1 decimal place
      }
      
      // Update car with correct review count and rating
      await Car.findByIdAndUpdate(car._id, {
        numberOfReviews: reviewCount,
        rating: avgRating
      });
      
      console.log(`Updated car ${car._id} (${car.brand} ${car.model}): ${reviewCount} reviews, rating: ${avgRating}`);
    }
    
    console.log('Review count update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating review counts:', error);
    process.exit(1);
  }
};

// Run the update function
updateReviewCounts();
