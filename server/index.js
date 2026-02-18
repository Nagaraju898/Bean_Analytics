// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./database/db');
const config = require('./config');

const app = express();

// Destructure config for easier use
const { PORT, NODE_ENV, JWT_SECRET, CORS_ORIGIN, LOG_LEVEL, HOST, ENABLE_RATE_LIMITING } = config;

// ========== STARTUP LOG ==========
console.log(`
╔════════════════════════════════════════════╗
║  🚀  E-Commerce Analytics API Server      ║
╚════════════════════════════════════════════╝

📋 Configuration:
   Environment: ${NODE_ENV}
   Port: ${PORT}
   Host: ${HOST}
   CORS Origins: ${CORS_ORIGIN}
   Rate Limiting: ${ENABLE_RATE_LIMITING ? 'Enabled' : 'Disabled'}
   Log Level: ${LOG_LEVEL}
`);

// Initialize database
db.init();

// CORS configuration - allows all origins by default, restrict in production
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());
    
    // Allow requests with no origin (e.g., mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Body parser with error handler
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Error handler for body parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON', details: err.message });
  }
  next(err);
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const contentType = req.get('content-type') || 'none';
  console.log(`[${timestamp}] ${method} ${path} - ContentType: ${contentType}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body).substring(0, 300));
  }
  next();
});

/* --------- API ROUTES --------- */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/data', require('./routes/data'));

/* --------- HEALTH CHECK --------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`
✅ Server listening on ${HOST}:${PORT}
🌍 Access at: http://${HOST}:${PORT}
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
