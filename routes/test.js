const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * @swagger
 * /test/protected:
 *   get:
 *     summary: Test protected route
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully accessed protected route
 *       401:
 *         description: Unauthorized
 */
router.get('/protected', auth.protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'You have accessed a protected route',
    user: req.user
  });
});

/**
 * @swagger
 * /test/admin:
 *   get:
 *     summary: Test admin route
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully accessed admin route
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not an admin)
 */
router.get('/admin', auth.protect, auth.restrictTo('admin'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'You have accessed an admin route',
    user: req.user
  });
});

/**
 * @swagger
 * /test/user:
 *   get:
 *     summary: Test user route
 *     tags: [Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully accessed user route
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a user)
 */
router.get('/user', auth.protect, auth.restrictTo('user'), (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'You have accessed a user route',
    user: req.user
  });
});

module.exports = router; 