const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { protect, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Car:
 *       type: object
 *       required:
 *         - make
 *         - model
 *         - year
 *         - price
 *       properties:
 *         make:
 *           type: string
 *           description: Car manufacturer
 *         model:
 *           type: string
 *           description: Car model
 *         year:
 *           type: integer
 *           description: Manufacturing year
 *         price:
 *           type: number
 *           description: Rental price per day
 *         description:
 *           type: string
 *           description: Car description
 *         image:
 *           type: string
 *           description: URL to car image
 *         available:
 *           type: boolean
 *           description: Car availability status
 */

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car management endpoints
 */

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of cars
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     cars:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Car'
 */
router.get('/', carController.getAllCars);

/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get a car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     car:
 *                       $ref: '#/components/schemas/Car'
 */
router.get('/:id', carController.getCar);

// Admin routes
router.use(protect, isAdmin);

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Create a new car (Admin only)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - brand
 *               - model
 *               - year
 *               - category
 *               - type
 *               - transmission
 *               - fuelType
 *               - seats
 *               - pricePerDay
 *               - photos
 *               - description
 *               - location
 *               - mileage
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               category:
 *                 type: string
 *                 enum: [economy, compact, midsize, luxury, suv, van, sports]
 *               type:
 *                 type: string
 *                 enum: [sedan, hatchback, suv, crossover, coupe, convertible, minivan, pickup]
 *               transmission:
 *                 type: string
 *                 enum: [automatic, manual]
 *               fuelType:
 *                 type: string
 *                 enum: [petrol, diesel, electric, hybrid]
 *               seats:
 *                 type: integer
 *               pricePerDay:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               mileage:
 *                 type: number
 *     responses:
 *       201:
 *         description: Car created successfully
 */
router.post('/', carController.createCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   patch:
 *     summary: Update a car (Admin only)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               category:
 *                 type: string
 *               type:
 *                 type: string
 *               transmission:
 *                 type: string
 *               fuelType:
 *                 type: string
 *               seats:
 *                 type: integer
 *               pricePerDay:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               description:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               mileage:
 *                 type: number
 *               replacePhotos:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Car updated successfully
 */
router.patch('/:id', carController.updateCar);

/**
 * @swagger
 * /api/cars/{id}:
 *   delete:
 *     summary: Delete a car (Admin only)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Car deleted successfully
 */
router.delete('/:id', carController.deleteCar);

/**
 * @swagger
 * /api/cars/{id}/toggle-availability:
 *   patch:
 *     summary: Toggle car availability (Admin only)
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Car availability toggled successfully
 */
router.patch('/:id/toggle-availability', carController.toggleAvailability);

module.exports = router; 