const Car = require('../models/Car');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// First, define a function to create a car directory
const createCarDirectory = (carName, existingDirName = null) => {
  const uploadPath = process.env.UPLOAD_PATH || 'uploads';
  
  // Create main uploads directory if it doesn't exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  // Use existing directory name if provided (for updates)
  if (existingDirName) {
    const existingPath = path.join(uploadPath, existingDirName);
    if (fs.existsSync(existingPath)) {
      return { path: existingPath, dirName: existingDirName };
    }
  }
  
  // Sanitize the car name to make it suitable for a directory name
  const sanitizedName = carName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  
  // Create a unique directory name
  const dirName = sanitizedName;
  const dirPath = path.join(uploadPath, dirName);
  
  // Create the directory if it doesn't exist
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  return { path: dirPath, dirName: dirName };
};

// Configure multer for temporary uploads
const tempStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = process.env.UPLOAD_PATH || 'uploads';
    const tempPath = path.join(uploadPath, 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    
    cb(null, tempPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create a temporary upload middleware
const tempUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE
  },
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).array('photos', 5); // Allow up to 5 photos

// Create a new car
exports.createCar = async (req, res) => {
  try {
    // Step 1: Upload files to temporary directory
    tempUpload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      } else if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      // Now that form data is parsed, get the car name
      const carName = req.body.name || `${req.body.brand || req.body.make} ${req.body.model} ${req.body.year}`;
      console.log('Creating car with name:', carName);
      
      // Step 2: Create a proper directory for the car
      const { path: carDirPath, dirName: carDirName } = createCarDirectory(carName);
      console.log('Created car directory:', carDirName);
      
      // Step 3: Move files from temp directory to car directory
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const newFileName = 'photo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
          const newFilePath = path.join(carDirPath, newFileName);
          
          // Move the file
          fs.renameSync(file.path, newFilePath);
          
          // Store relative path
          const relativePath = path.join(carDirName, newFileName).replace(/\\/g, '/');
          photos.push(relativePath);
        }
      }
      
      // Step 4: Create the car record
      const car = await Car.create({
        ...req.body,
        photos,
        carDirName // Save the directory name in the car document
      });

      res.status(201).json({
        status: 'success',
        data: {
          car
        }
      });
    });
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all cars
exports.getAllCars = async (req, res) => {
  try {
    // Get query parameters
    const { showAll } = req.query;
    
    // Build query - Only show cars with stock > 0 unless showAll=true
    let query = {};
    
    if (showAll !== 'true') {
      query = { 
        stock: { $gt: 0 },
        availability: true
      };
    }
    
    const cars = await Car.find(query);
    console.log(`Found ${cars.length} cars`);
    
    res.status(200).json({
      status: 'success',
      results: cars.length,
      data: {
        cars
      }
    });
  } catch (error) {
    console.error('Error getting all cars:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a car by ID
exports.getCar = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid car ID format'
      });
    }

    const car = await Car.findById(id);
    if (!car) {
      console.error('Car not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Car not found'
      });
    }

    console.log('Retrieved car:', car.name, 'with directory:', car.carDirName);
    res.status(200).json({
      status: 'success',
      data: {
        car
      }
    });
  } catch (error) {
    console.error('Error getting car:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a car
exports.updateCar = async (req, res) => {
  try {
    // Validate ObjectId format first
    const id = req.params.id;
    console.log('Updating car with ID:', id);
    
    if (!mongoose.isValidObjectId(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid car ID format'
      });
    }
    
    // Load the car first
    const existingCar = await Car.findById(id);
    if (!existingCar) {
      console.error('Car not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Car not found'
      });
    }
    
    // Step 1: Upload files to temporary directory
    tempUpload(req, res, async function(err) {
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err.message);
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      } else if (err) {
        console.error('Upload error:', err.message);
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }

      // Now that form data is parsed, get the car name
      const carName = req.body.name || `${req.body.brand || req.body.make} ${req.body.model} ${req.body.year}`;
      console.log('Updating car with name:', carName);
      
      // Step 2: Use existing car directory or create a new one if needed
      const { path: carDirPath, dirName: carDirName } = createCarDirectory(
        carName, 
        existingCar.carDirName // Pass existing directory name if available
      );
      console.log('Using car directory:', carDirName);
      
      // Step 3: Move files from temp directory to car directory
      const newPhotos = [];
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const newFileName = 'photo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
          const newFilePath = path.join(carDirPath, newFileName);
          
          // Move the file
          fs.renameSync(file.path, newFilePath);
          
          // Store relative path
          const relativePath = path.join(carDirName, newFileName).replace(/\\/g, '/');
          newPhotos.push(relativePath);
        }
      }
      
      // Combine existing photos with new ones if not replacing
      const photos = req.body.replacePhotos ? newPhotos : [...existingCar.photos, ...newPhotos];

      console.log('Request body for update:', req.body);
      
      // Step 4: Update the car record
      const updatedCar = await Car.findByIdAndUpdate(
        id,
        {
          ...req.body,
          photos,
          carDirName // Always use the directory name we determined
        },
        {
          new: true,
          runValidators: true
        }
      );

      console.log('Car updated successfully:', updatedCar.name);
      res.status(200).json({
        status: 'success',
        data: {
          car: updatedCar
        }
      });
    });
  } catch (error) {
    console.error('Error updating car:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a car
exports.deleteCar = async (req, res) => {
  try {
    // Validate ObjectId format first
    const id = req.params.id;
    console.log('Deleting car with ID:', id);
    
    if (!mongoose.isValidObjectId(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid car ID format'
      });
    }
    
    const car = await Car.findById(id);
    if (!car) {
      console.error('Car not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Car not found'
      });
    }

    // Delete photos from storage
    car.photos.forEach(photo => {
      const fullPath = path.join(process.env.UPLOAD_PATH || 'uploads', photo);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
    
    // Delete the car directory if it exists
    if (car.carDirName) {
      const carDirPath = path.join(process.env.UPLOAD_PATH || 'uploads', car.carDirName);
      if (fs.existsSync(carDirPath)) {
        try {
          // Check if directory is empty first
          const files = fs.readdirSync(carDirPath);
          if (files.length === 0) {
            fs.rmdirSync(carDirPath);
          }
        } catch (err) {
          console.error('Error deleting car directory:', err);
        }
      }
    }

    // Use deleteOne instead of deprecated remove()
    await Car.deleteOne({ _id: id });
    
    console.log('Car deleted successfully:', car.name);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting car:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Toggle car availability
exports.toggleAvailability = async (req, res) => {
  try {
    // Validate ObjectId format first
    const id = req.params.id;
    console.log('Toggling availability for car with ID:', id);
    
    if (!mongoose.isValidObjectId(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid car ID format'
      });
    }
    
    const car = await Car.findById(id);
    if (!car) {
      console.error('Car not found with ID:', id);
      return res.status(404).json({
        status: 'error',
        message: 'Car not found'
      });
    }

    car.availability = !car.availability;
    await car.save();

    console.log('Car availability toggled successfully:', car.name, 'Available:', car.availability);
    res.status(200).json({
      status: 'success',
      data: {
        car
      }
    });
  } catch (error) {
    console.error('Error toggling car availability:', error.message);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 