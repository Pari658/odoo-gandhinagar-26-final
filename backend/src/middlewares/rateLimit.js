import rateLimit from 'express-rate-limit';

const createRateLimiter = (maxRequests, windowMs = 90 * 60 * 1000) => {
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

// Rate limiter configured for 90-minute window
export const authLimiter = createRateLimiter(5000, 90 * 60 * 1000); // 50 requests per 90 minutes
export const apiLimiter = createRateLimiter(5000, 90 * 60 * 1000); // 500 requests per 90 minutes
