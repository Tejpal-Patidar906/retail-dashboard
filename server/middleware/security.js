const rateLimit = require('express-rate-limit');

// 1. Strict Origin / Anti-Postman Middleware
// Block requests that do not come from a browser (missing origin/referer)
const strictOrigin = (req, res, next) => {
  // Allow health check route without origin
  if (req.path === '/api/health') return next();
  
  // We allow requests if they have a valid Origin, Referer, or our custom App Client header
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const customHeader = req.headers['x-app-client'];

  if (!origin && !referer && customHeader !== 'GroceryIQ') {
    console.warn(`Blocked direct API access attempt to ${req.path} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Direct API access is blocked. Please use the official application.'
    });
  }

  // Optional: You can enforce that the origin exactly matches your client URL
  // if (origin && origin !== clientUrl) {
  //   return res.status(403).json({ success: false, message: 'Invalid origin.' });
  // }

  next();
};

// 2. API Rate Limiter
// Limit each IP to 200 requests per windowMs (15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased for development 
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { strictOrigin, apiLimiter };
