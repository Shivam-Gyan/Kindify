import rateLimit from "express-rate-limit";

// Define the login limiter
const loginLimiter = rateLimit({
  windowMs: 7 * 60 * 1000, // 7 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 7 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});


export { loginLimiter, globalLimiter}