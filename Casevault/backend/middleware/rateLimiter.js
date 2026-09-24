/**
 * Sliding Window Rate Limiter Middleware
 * Protects against brute-force credential stuffing and resource exhaustion (OWASP API4)
 */
class RateLimiter {
  constructor() {
    this.windows = new Map();
  }

  limit({ windowMs = 60000, max = 100, message = 'Too many requests. Please try again later.' }) {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress || '10.42.0.1';
      const key = `${req.baseUrl || req.path}:${ip}`;
      const now = Date.now();

      let record = this.windows.get(key);
      if (!record) {
        record = { count: 1, resetTime: now + windowMs };
        this.windows.set(key, record);
      } else {
        if (now > record.resetTime) {
          record.count = 1;
          record.resetTime = now + windowMs;
        } else {
          record.count++;
        }
      }

      // Add standard rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > max) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `${message} (Retry after ${Math.ceil((record.resetTime - now) / 1000)}s)`,
            requestId: req.requestId
          }
        });
      }

      next();
    };
  }
}

const rateLimiter = new RateLimiter();
module.exports = rateLimiter;
