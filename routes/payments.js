const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// Replace with your actual Stripe secret key
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY');

/**
 * @swagger
 * /payments/create-payment-intent:
 *   post:
 *     summary: Create a payment intent for a booking
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - amount
 *             properties:
 *               bookingId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/create-payment-intent', auth.protect, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID and amount are required'
      });
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user is authorized
    const userId = req.user.id.toString();
    const bookingUserId = booking.userId.toString();
    
    console.log('User IDs:', { userId, bookingUserId });

    // Only the booking owner or an admin can make a payment
    if (userId !== bookingUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'You are not authorized to make a payment for this booking'
      });
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: 'usd',
      metadata: {
        bookingId,
        userId: req.user.id
      }
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    booking.paymentStatus = 'pending';
    await booking.save();

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment intent: ' + error.message
    });
  }
});

/**
 * @swagger
 * /payments/confirm-payment:
 *   post:
 *     summary: Confirm a successful payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - paymentIntentId
 *             properties:
 *               bookingId:
 *                 type: string
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/confirm-payment', auth.protect, async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking ID and payment intent ID are required'
      });
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Retrieve payment intent from Stripe to verify its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        status: 'error',
        message: `Payment has not succeeded. Status: ${paymentIntent.status}`
      });
    }

    // Update booking payment status
    booking.paymentStatus = 'completed';
    booking.status = 'confirmed'; // Optionally update booking status
    await booking.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment confirmed successfully',
      booking: booking
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm payment: ' + error.message
    });
  }
});

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    // Replace with your actual webhook signing secret
    const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ message: error.message });
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful:', paymentIntent.id);
      
      // Find booking by metadata and update status
      if (paymentIntent.metadata && paymentIntent.metadata.bookingId) {
        try {
          const booking = await Booking.findById(paymentIntent.metadata.bookingId);
          if (booking) {
            booking.paymentStatus = 'completed';
            booking.status = 'confirmed';
            await booking.save();
            console.log('Booking updated via webhook:', booking._id);
          }
        } catch (err) {
          console.error('Error updating booking via webhook:', err);
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;
