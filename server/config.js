/**
 * Server Configuration
 * 
 * Centralized configuration for all environment variables
 * Used across routes and services
 */

require('dotenv').config();

const config = {
  // Application Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost,http://localhost:3000',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB in bytes
  
  // Database
  DATABASE_PATH: process.env.DATABASE_PATH || './database/analytics.db',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Server
  HOST: process.env.HOST || '0.0.0.0',
  
  // Feature Flags
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Validate configuration
const validateConfig = () => {
  const isDev = config.NODE_ENV === 'development';
  
  // In production, ensure critical values are changed from defaults
  if (!isDev) {
    if (config.JWT_SECRET === 'your-secret-key-change-in-production') {
      throw new Error('❌ JWT_SECRET must be set in production! Update your .env file.');
    }
  }
  
  // Validate numeric values
  if (config.PORT < 1 || config.PORT > 65535) {
    throw new Error('❌ PORT must be between 1 and 65535');
  }
  
  if (config.MAX_FILE_SIZE < 0) {
    throw new Error('❌ MAX_FILE_SIZE must be positive');
  }
};

// Validate on load
try {
  validateConfig();
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

// Log configuration in development
if (config.NODE_ENV === 'development') {
  console.log('📋 Loaded Configuration:', {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    HOST: config.HOST,
    CORS_ORIGIN: config.CORS_ORIGIN,
    MAX_FILE_SIZE: `${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
  });
}

module.exports = config;
