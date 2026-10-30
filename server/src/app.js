const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or any matching origin
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing with safe size bounds
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simulated Environment & API Identification Header
app.use((req, res, next) => {
  res.setHeader('X-Environment', 'DataTrustOps-Simulation');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Root entry point info
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'DataTrust Ops API',
    description: 'AI-assisted data reliability & pipeline observability platform',
    environment: 'Simulated Data Operations',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Mount core API router
app.use('/api', apiRoutes);

// Catch 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found on DataTrust Ops server.`
    },
    timestamp: new Date().toISOString()
  });
});

// Global centralized error handler
app.use(errorHandler);

module.exports = app;
