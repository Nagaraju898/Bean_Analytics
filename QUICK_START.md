# 🚀 Quick Deployment Guide

Complete professional SaaS Docker Compose deployment in 5 minutes.

## Prerequisites

- Docker installed
- Docker Compose v2.0+
- Domain name (for production SSL)

## 1. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # or your preferred editor
```

**Required Changes:**
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env with:
JWT_SECRET=<generated-random-string>
CORS_ORIGIN=https://your-domain.com
REACT_APP_API_URL=https://your-domain.com/api
```

## 2. SSL Certificates

### Option A: Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy to Docker directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $(whoami):$(whoami) nginx/ssl/*
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem
```

### Option B: Self-Signed (Testing Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=localhost"
```

## 3. Build & Deploy

### Development Mode (with live reload)

```bash
# docker-compose.override.yml is active by default
docker-compose build
docker-compose up -d

# Access services:
# Backend:  http://localhost:5000/api/health
# Frontend: http://localhost:3000
# Nginx:    http://localhost or https://localhost
```

### Production Mode (optimized)

```bash
# Remove development override
rm docker-compose.override.yml

# Build production images
docker-compose build

# Start all services
docker-compose up -d

# Verify deployment
docker-compose ps
curl https://your-domain.com/api/health
```

## 4. Verify Deployment

```bash
# Check all services are running and healthy
docker-compose ps

# Expected output:
# NAME                STATUS
# analytics-backend   Up (healthy)
# analytics-frontend  Up (healthy)
# analytics-nginx     Up (healthy)

# View logs
docker-compose logs -f

# Test API
curl https://your-domain.com/api/health

# Test frontend
curl https://your-domain.com
```

## 5. Monitoring

```bash
# View resource usage
docker stats

# Check logs
docker-compose logs backend --tail=50
docker-compose logs frontend --tail=50
docker-compose logs nginx --tail=50

# View real-time logs
docker-compose logs -f
```

## Management Commands

```bash
# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose build && docker-compose up -d

# Clean up resources
docker system prune -f

# View service status
docker-compose ps

# Execute commands in container
docker-compose exec backend node -e "console.log('test')"
```

## Architecture Overview

```
Your Domain (HTTPS)
        ↓
   Nginx (port 443)
    ├─→ Backend API (port 5000)
    └─→ Frontend SPA (port 3000)
        ↓
  SQLite Database (persistent volume)
```

## Directory Structure

```
project_3/
├── docker-compose.yml         # Production config
├── docker-compose.override.yml  # Development config (remove for production)
├── .env                       # Environment variables (created from .env.example)
├── .env.example              # Template
│
├── nginx/
│   ├── nginx.conf            # Reverse proxy config
│   └── ssl/
│       ├── cert.pem          # SSL certificate
│       └── key.pem           # SSL private key
│
├── server/
│   ├── Dockerfile            # Backend build
│   ├── index.js              # Express app
│   └── ...
│
├── client/
│   ├── Dockerfile            # Frontend build
│   ├── src/                  # React code
│   └── ...
│
└── data/                     # Persistent volumes
    ├── backend/              # SQLite database
    └── nginx/
        ├── logs/             # Access/error logs
        └── cache/            # Response cache
```

## Troubleshooting

### Containers fail to start

```bash
# Check logs
docker-compose logs

# Verify .env file exists
cat .env | head

# Check ports not already in use
netstat -ano | findstr :80
netstat -ano | findstr :443
```

### SSL certificate errors

```bash
# Verify certificates exist
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep -A 2 Validity

# Test HTTPS (ignore self-signed warning)
curl -k https://localhost/api/health
```

### Database issues

```bash
# Check backend logs
docker-compose logs backend | grep -i error

# Access SQLite database
docker-compose exec backend sqlite3 /app/data/analytics.db
sqlite> .tables
sqlite> .exit
```

### CORS errors

```bash
# Verify CORS_ORIGIN in .env
grep CORS_ORIGIN .env

# Should match your domain
CORS_ORIGIN=https://your-domain.com

# Restart backend
docker-compose restart backend
```

## Production Deployment Checklist

Before going live:

- [ ] `.env` configured with production values
- [ ] `JWT_SECRET` changed from default (32+ characters)
- [ ] `CORS_ORIGIN` set to production domain
- [ ] `NODE_ENV=production` in .env
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] `docker-compose.override.yml` removed (development only)
- [ ] Domain DNS points to server IP
- [ ] Firewall allows ports 80, 443
- [ ] All containers built: `docker-compose build`
- [ ] All services healthy: `docker-compose ps`
- [ ] Health check passes: `curl https://your-domain.com/api/health`
- [ ] Frontend loads: `curl https://your-domain.com`
- [ ] User registration/login working
- [ ] Database persists after restart
- [ ] Logs configured and accessible

## Next Steps

- Setup automated backups for `./data/backend/`
- Configure Let's Encrypt auto-renewal
- Enable CloudWatch or Datadog monitoring
- Setup CI/CD for automatic deployments
- Configure database backups (SQLite or PostgreSQL)

## Documentation

- **Full Architecture:** [DOCKER_SAAS_ARCHITECTURE.md](DOCKER_SAAS_ARCHITECTURE.md)
- **SSL Setup:** [nginx/SSL_SETUP.md](nginx/SSL_SETUP.md)
- **Backend Config:** [BACKEND_ENV_CONFIG.md](BACKEND_ENV_CONFIG.md)
- **Docker Commands:** [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)

---

**Your professional SaaS platform is ready! 🎉**

For support, questions, or issues:
- Check logs: `docker-compose logs -f`
- Review architecture: [DOCKER_SAAS_ARCHITECTURE.md](DOCKER_SAAS_ARCHITECTURE.md)
- SSL troubleshooting: [nginx/SSL_SETUP.md](nginx/SSL_SETUP.md)
