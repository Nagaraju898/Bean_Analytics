const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./database/db');
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
db.init();

app.use(cors());

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

/* --------- SERVE REACT --------- */
app.use(express.static(path.join(__dirname, '../client/build'), {
  maxAge: 0
}));

/* --------- REACT ROUTING FALLBACK --------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
