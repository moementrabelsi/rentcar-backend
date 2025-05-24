/**
 * Async handler function to eliminate try-catch blocks in routes
 * @param {Function} fn - Express route handler function
 * @returns {Function} - Express middleware function with error handling
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Export as a named export to match how it's imported in controllers
module.exports = { asyncHandler };
