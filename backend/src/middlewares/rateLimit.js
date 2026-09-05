import rateLimit from 'express-rate-limit';

const createRateLimiter = (maxRequests, windowMs = 15 * 60 * 4000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({
        success: false,
        data: null,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Too many requests, please try again after ${windowMs / 60000} minutes.`
        }
      });
    }
  });
};

// Strict rate limiter for authentication endpoints (e.g., login, signup)
export const authLimiter = createRateLimiter(15); // 15 requests per 15 minutes

// Standard rate limiter for all other API endpoints
export const apiLimiter = createRateLimiter(100); // 100 requests per 15 minutes
