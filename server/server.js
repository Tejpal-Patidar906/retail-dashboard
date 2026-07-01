const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { strictOrigin, apiLimiter } = require('./middleware/security');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const inventoryRoutes = require('./routes/inventory');
const customerRoutes = require('./routes/customers');
const staffRoutes = require('./routes/staff');
const reportRoutes = require('./routes/reports');
const storeRoutes = require('./routes/store');
const expenseRoutes = require('./routes/expenses');

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Security Middlewares
// app.use(strictOrigin);    // Block non-browser requests (Postman/Hoppscotch)
// app.use(apiLimiter);      // Global rate limiter (Disabled)
app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));        // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL Injection
app.use(xss());           // Prevent XSS attacks

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());



// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
