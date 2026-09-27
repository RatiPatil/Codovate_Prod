const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If it's a predicted AppError
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.statusCode, err.message, err.errors);
  }

  // Handle Firebase Auth errors if they bubble up
  if (err.code && err.code.startsWith('auth/')) {
    return ApiResponse.error(res, 401, err.message);
  }

  // Fallback to 500 for unhandled bugs
  console.error('[UNHANDLED ERROR]', err);
  
  // Don't leak stack traces to client in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  return ApiResponse.error(res, 500, message);
};

module.exports = errorHandler;
