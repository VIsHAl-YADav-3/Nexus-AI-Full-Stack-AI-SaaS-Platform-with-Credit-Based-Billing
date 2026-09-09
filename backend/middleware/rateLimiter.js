const rateLimit = require('express-rate-limit');

/**
 * Per-user rate limit for the AI chat route: 5 requests per minute.
 * Keyed by the authenticated user's ID (req.user is attached by `protect`
 * middleware, which must run before this limiter).
 */
const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? req.user._id.toString() : req.ip),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many AI requests. Please wait a moment before trying again.',
    });
  },
});

/**
 * General-purpose limiter for auth routes to slow down brute-force attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts. Please try again later.',
    });
  },
});

module.exports = { aiChatLimiter, authLimiter };
