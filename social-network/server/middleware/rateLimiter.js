/**
 * Simple in-memory rate limiter middleware
 * For production, use Redis-based rate limiting for distributed systems
 */

const rateLimitStore = new Map();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

/**
 * Creates a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum number of requests per window (default: 100)
 * @param {string} options.message - Error message when rate limited
 * @param {boolean} options.skipFailedRequests - Don't count failed requests (default: false)
 * @param {Function} options.keyGenerator - Function to generate unique key (default: IP-based)
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests, please try again later',
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Get or create rate limit data
    let data = rateLimitStore.get(key);
    
    if (!data || data.resetTime < now) {
      data = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, data);
    }

    // Check if rate limited
    if (data.count >= max) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter);
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', 0);
      res.set('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));
      
      return res.status(429).json({
        success: false,
        message,
        retryAfter
      });
    }

    // Increment counter
    data.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - data.count));
    res.set('X-RateLimit-Reset', Math.ceil(data.resetTime / 1000));

    // Handle skipFailedRequests
    if (skipFailedRequests) {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          data.count = Math.max(0, data.count - 1);
        }
      });
    }

    next();
  };
};

// Pre-configured rate limiters for different use cases

// General API rate limiter: 100 requests per 15 minutes
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Auth rate limiter: 30 attempts per 15 minutes (more lenient for development)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts, please try again after 15 minutes',
  skipFailedRequests: true  // Don't count validation errors
});

// Create post rate limiter: 30 posts per hour
const createPostLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'You have created too many posts. Please wait before posting again.'
});

// Comment rate limiter: 60 comments per hour
const commentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Too many comments. Please wait before commenting again.'
});

// Follow rate limiter: 100 follows per hour
const followLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many follow requests. Please wait before following more users.'
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  createPostLimiter,
  commentLimiter,
  followLimiter
};
