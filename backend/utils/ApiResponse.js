/**
 * ApiResponse
 * Standardized API response formatter.
 */
class ApiResponse {
  /**
   * Send a successful response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {any} data - The payload
   * @param {Object} [pagination] - { nextCursor, hasMore }
   * @param {Object} [meta] - Any additional metadata
   */
  static success(res, statusCode = 200, message = 'Success', data = null, pagination = null, meta = null) {
    const response = {
      success: true,
      message,
      data
    };
    
    if (pagination) response.pagination = pagination;
    if (meta) response.meta = meta;

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response (usually handled by errorHandler middleware, but can be used directly)
   */
  static error(res, statusCode = 500, message = 'Internal Server Error', errors = null) {
    const response = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
