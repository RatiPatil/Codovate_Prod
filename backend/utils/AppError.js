/**
 * AppError
 * Custom error class for centralized error handling.
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational; // true for predicted errors (4xx), false for bugs (5xx)
    this.errors = errors; // array of validation errors, etc.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
