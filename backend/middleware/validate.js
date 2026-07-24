const AppError = require('../utils/AppError');

/**
 * validateSchema
 * Express middleware to validate req.body against a Joi schema.
 * 
 * @param {import('joi').ObjectSchema} schema 
 */
const validateSchema = (schema) => (req, res, next) => {
  if (!schema) return next();

  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  
  if (error) {
    const errorDetails = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message.replace(/\"/g, '') // Remove Joi's default quotes
    }));
    
    // Pass to global error handler
    return next(new AppError('Validation Error', 400, true, errorDetails));
  }

  // Replace req.body with sanitized values
  req.body = value;
  next();
};

module.exports = validateSchema;
