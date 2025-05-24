/**
 * Catch async errors in Express route handlers and pass them to the error middleware
 * This eliminates the need for try/catch blocks in controllers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function with error handling
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
