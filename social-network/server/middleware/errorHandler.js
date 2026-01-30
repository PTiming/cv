// List of sensitive fields that should never be logged
const SENSITIVE_FIELDS = ['password', 'moodlePassword', 'token', 'moodleToken', 'secret'];

// Sanitize error objects to remove sensitive data before logging
const sanitizeForLogging = (obj, depth = 0) => {
  if (depth > 10 || !obj) return obj;
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key of Object.keys(obj)) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(obj[key], depth + 1);
      }
    }
    return sanitized;
  }
  
  return obj;
};

const errorHandler = (err, req, res, next) => {
  // Sanitize error before logging to prevent sensitive data exposure
  const sanitizedError = {
    message: err.message,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };
  console.error('Error:', sanitizeForLogging(sanitizedError));

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid resource ID'
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
};

module.exports = errorHandler;
