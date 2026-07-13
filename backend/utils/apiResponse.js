/**
 * Standardized API Response Formatter
 * Used by all /v1/ API routes to ensure frontend consistency
 */

const sendResponse = (res, statusCode, success, message, data = null, errors = null) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
    errors,
    timestamp: new Date().toISOString()
  });
};

const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return sendResponse(res, statusCode, true, message, data, null);
};

const sendError = (res, message, errors = null, statusCode = 500) => {
  return sendResponse(res, statusCode, false, message, null, errors);
};

module.exports = { sendResponse, sendSuccess, sendError };
