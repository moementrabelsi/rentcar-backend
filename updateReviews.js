require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('./models/Review');
const Car = require('./models/Car');

// Connect to MongoDB using the same connection string as the main app
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all cars
      const cars = await Car.find();
      console.log(`Found ${cars.length} cars to process`);
      
      // Process each car
      for (const car of cars) {
        // Count reviews for this car
        const reviews = await Review.find({ carId: car._id.toString() });
        const reviewCount = reviews.length;
        
        // Calculate average rating if there are reviews
        let avgRating = 0;
        if (reviewCount > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          avgRating = Math.round((totalRating / reviewCount) * 10) / 10; // Round to 1 decimal place
        }
        
        console.log(`Car ${car._id} (${car.model}): Found ${reviewCount} reviews, current count in DB: ${car.numberOfReviews}`);
        
        // Update car with correct review count and rating
        await Car.findByIdAndUpdate(car._id, {
          numberOfReviews: reviewCount,
          rating: avgRating
        });
        
        console.log(`Updated car ${car._id} (${car.model}): ${reviewCount} reviews, rating: ${avgRating}`);
      }
      
      console.log('Review count update completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error updating review counts:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
