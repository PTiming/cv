const rateLimit = require('express-rate-limit');

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for creating content (posts, comments)
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 creates per minute
  message: { message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  createLimiter
};
