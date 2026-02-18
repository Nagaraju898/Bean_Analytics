# Backend Environment Configuration Guide

## Overview

Your Express backend now has comprehensive environment variable support using `dotenv`, making it production-ready with proper configuration management.

## Files

### Configuration Files
- **`server/config.js`** - Centralized environment configuration (NEW)
- **`.env.example`** - Template with all available variables
- **`.env.development`** - Development defaults (NEW)
- **`.env`** - Your local environment (git-ignored, created from .env.example)

### Updated Files
- **`server/index.js`** - Uses config file, added graceful shutdown
- **`server/routes/auth.js`** - Uses centralized JWT configuration

## Quick Start

### Development

```bash
# 1. Copy template
cp .env.example .env

# 2. Update .env for your environment (or use defaults)
# The defaults work for local Docker development

# 3. Build and start
docker-compose build
docker-compose up -d

# 4. Check logs
docker-compose logs -f backend
```

### Production

```bash
# 1. Copy template
cp .env.example .env

# 2. Update critical variables for production
# MUST CHANGE:
# - NODE_ENV=production
# - JWT_SECRET=<your-secure-random-key>
# - CORS_ORIGIN=https://your-domain.com
# - REACT_APP_API_URL=https://your-domain.com/api

# 3. Verify configuration
docker-compose exec backend node -e "const c = require('./config'); console.log(c);"

# 4. Deploy
docker-compose -f docker-compose.yml up -d
```

## Environment Variables

### Core Application

| Variable | Default | Purpose | Development | Production |
|----------|---------|---------|-------------|------------|
| `NODE_ENV` | `development` | Environment mode | `development` | `production` |
| `HOST` | `0.0.0.0` | Listen address | `0.0.0.0` | `0.0.0.0` |
| `PORT` | `5000` | Server port | `5000` | `5000` |
| `LOG_LEVEL` | `info` | Logging verbosity | `debug` | `info` |

### Security (CRITICAL)

| Variable | Default | Purpose | Notes |
|----------|---------|---------|-------|
| `JWT_SECRET` | ⚠️ Default string | JWT signing key | **MUST CHANGE** in production |
| `JWT_EXPIRE` | `7d` | Token expiration | Format: `7d`, `24h`, `1w` |
| `CORS_ORIGIN` | `http://localhost,...` | Allowed CORS origins | Comma-separated origins |

### Rate Limiting

| Variable | Default | Purpose |
|----------|---------|---------|
| `ENABLE_RATE_LIMITING` | `true` | Enable rate limiting |
| `RATE_LIMIT_WINDOW` | `15` | Window size in minutes |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### File Upload

| Variable | Default | Purpose |
|----------|---------|---------|
| `MAX_FILE_SIZE` | `52428800` | Max file size in bytes (50MB) |

### Database

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_PATH` | `./database/analytics.db` | SQLite database location |

## Configuration Validation

### On Application Start

The `config.js` file validates configuration:

```javascript
✅ Valid configuration:
   - NODE_ENV is development or production
   - JWT_SECRET is not default value (in production)
   - PORT is between 1-65535
   - MAX_FILE_SIZE is positive

❌ Invalid configuration:
   - Production with default JWT_SECRET
   - Invalid port number
   - Missing required variables
```

### Manual Validation

```bash
# Check loaded configuration (development mode only)
docker-compose exec backend node -e "const c = require('./config'); console.log(c);"

# Or in running container
docker-compose exec backend bash
node -e "const c = require('./config'); console.log(c);"
```

## Startup Logging

The server logs configuration on startup:

```
╔════════════════════════════════════════════╗
║  🚀  E-Commerce Analytics API Server      ║
╚════════════════════════════════════════════╝

📋 Configuration:
   Environment: production
   Port: 5000
   Host: 0.0.0.0
   CORS Origins: https://your-domain.com,https://www.your-domain.com
   Rate Limiting: Enabled
   Log Level: info

✅ Server listening on 0.0.0.0:5000
🌍 Access at: http://0.0.0.0:5000
```

## Development Setup

### Using .env.development

```bash
# Option 1: Automatically load (if dotenv supports NODE_ENV)
# The app loads .env.development in development mode

# Option 2: Manual override
NODE_ENV=development npm start
```

### Development Defaults
- `NODE_ENV=development` - Logs config on startup
- `LOG_LEVEL=debug` - Verbose logging
- `RATE_LIMITING=false` - No rate limiting during dev
- `JWT_SECRET=dev-secret` - Non-secure for development

## Production Setup

### Environment Variables to Configure

**Critical** (must change):
```env
NODE_ENV=production
JWT_SECRET=generate-a-random-32-char-string-here-min-32-chars
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
REACT_APP_API_URL=https://your-domain.com/api
```

**Recommended**:
```env
LOG_LEVEL=warn              # Less logging in production
ENABLE_RATE_LIMITING=true   # Protect API from abuse
RATE_LIMIT_WINDOW=15        # 15 minute window
RATE_LIMIT_MAX_REQUESTS=100 # 100 requests per window
```

### Generating Secure JWT_SECRET

```bash
# Generate a random 32+ character string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

### Deployment Checklist

```bash
# ✅ 1. Copy and configure .env
cp .env.example .env
# Edit with production values

# ✅ 2. Validate configuration
docker-compose exec backend node -e "const c=require('./config'); process.exit(0);"

# ✅ 3. Verify environment
docker-compose exec backend echo $NODE_ENV  # Should output: production
docker-compose exec backend echo $JWT_SECRET # Should NOT be default

# ✅ 4. Check CORS
docker-compose logs backend | grep "CORS"

# ✅ 5. Test API endpoint
curl -H "Authorization: Bearer $TOKEN" https://your-domain.com/api/health

# ✅ 6. Monitor startup
docker-compose logs -f backend
```

## Graceful Shutdown

The server handles shutdown signals:

```javascript
// SIGTERM and SIGINT both trigger:
// 1. Stop accepting new connections
// 2. Wait for existing requests to finish
// 3. Close database connection
// 4. Exit cleanly
```

**Benefit in Docker**: When containers receive SIGTERM, the server shuts down cleanly.

## Error Handling

### Production Error Validation

```javascript
// On startup in production:
if (NODE_ENV === 'production') {
  if (JWT_SECRET === 'your-secret-...') {
    console.error('❌ JWT_SECRET must be set in production!');
    process.exit(1);  // Exit with error
  }
}
```

### Runtime Error Catching

```javascript
// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  // Log and exit (prevent zombie processes)
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);  // Force exit
});
```

## Using Environment Variables in Routes

### Before
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'default-insecure';
```

### After
```javascript
const config = require('../config');
const JWT_SECRET = config.JWT_SECRET;
```

**Benefits**:
- ✅ Centralized configuration
- ✅ Validated on startup
- ✅ Consistent across app
- ✅ Easy to audit

## Docker Integration

### In docker-compose.yml

```yaml
backend:
  environment:
    NODE_ENV: production
    PORT: 5000
    # Add your variables here
  # Or load from .env file
  env_file:
    - .env
```

### Environment Priority (highest to lowest)

1. **Docker-compose environment** section
2. **env_file** (.env file)
3. **Process environment variables**
4. **Config defaults**

## Security Best Practices

### ✅ Implemented

- [x] JWT_SECRET validation in production
- [x] CORS configuration per environment
- [x] Graceful error handling
- [x] Detailed startup logging (dev only)
- [x] Environment-based defaults

### ✅ Recommended Additional

- [ ] Use secrets manager (AWS Secrets Manager, Vault)
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable HTTPS/TLS
- [ ] Implement API rate limiting
- [ ] Add request signing for APIs
- [ ] Use environment variable encryption

## Troubleshooting

### "JWT_SECRET must be set in production"

```bash
# Solution: Set JWT_SECRET in .env
echo "JWT_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" >> .env

# Verify
grep JWT_SECRET .env
```

### "Not allowed by CORS"

```bash
# Check current CORS setting
docker-compose exec backend echo $CORS_ORIGIN

# Add your domain to .env
CORS_ORIGIN=http://localhost,https://your-domain.com
```

### Configuration validation failed

```bash
# View full configuration
docker-compose exec backend node -e "const c=require('./config'); console.log(JSON.stringify(c, null, 2));"

# Check logs for validation errors
docker-compose logs backend | grep Error
```

## References

- **Config file**: `server/config.js`
- **Environment template**: `.env.example`
- **Development defaults**: `.env.development`
- **Updated server**: `server/index.js`
- **Updated routes**: `server/routes/auth.js`

## Summary

Your backend now has:
✅ Centralized config management
✅ Environment variable validation
✅ Production-ready defaults
✅ Graceful shutdown handling
✅ Comprehensive error handling
✅ Security best practices implemented

**Deploy with confidence!** 🚀
