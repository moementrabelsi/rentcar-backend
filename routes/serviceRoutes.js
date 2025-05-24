const express = require('express');
const { 
  createService,
  getServices,
  getService,
  updateService,
  deleteService
} = require('../controllers/additionalServiceController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getService);

// Protected routes
router.use(protect);

// Admin only routes
router.post('/', restrictTo('admin'), createService);
router.put('/:id', restrictTo('admin'), updateService);
router.delete('/:id', restrictTo('admin'), deleteService);

module.exports = router;
