# 🐳 BeanAnalytics - Complete Docker Setup Guide

**Status**: ✅ Fully Dockerized & Deployed  
**Version**: 1.0  
**Last Updated**: February 17, 2026  
**Environment**: AWS EC2 (13.221.255.219) - Production Ready

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Docker Components](#docker-components)
3. [File Structure](#file-structure)
4. [Build & Deployment](#build--deployment)
5. [Container Management](#container-management)
6. [Volumes & Data](#volumes--data)
7. [Networking](#networking)
8. [SSL/HTTPS Configuration](#ssltls-configuration)
9. [Environment Variables](#environment-variables)
10. [Troubleshooting](#troubleshooting)
11. [Production Checklist](#production-checklist)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              AWS EC2 Instance (13.221.255.219)              │
│                  Amazon Linux 2 - t3.micro                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Docker Compose Network                       │  │
│  │    (Bridge: project_3_app-network, 172.20.0.0/16)   │  │
│  │                                                       │  │
│  │  ┌──────────────────┐  ┌──────────────────────┐     │  │
│  │  │   Nginx          │  │   Backend            │     │  │
│  │  │ (nginx:alpine)   │  │  (Node.js 18-alpine) │     │  │
│  │  │                  │  │                      │     │  │
│  │  │ - Port 80→443    │  │ - Express.js         │     │  │
│  │  │ - SSL/TLS        │  │ - Port 5000          │     │  │
│  │  │ - Reverse Proxy  │  │ - SQLite DB          │     │  │
│  │  │ - Rate Limiting  │  │ - JWT Auth           │     │  │
│  │  │ - Compression    │  │ - File Uploads       │     │  │
│  │  └──────────────────┘  └──────────────────────┘     │  │
│  │         ↓ (Port 3000)             ↓                   │  │
│  │  ┌─────────────────────────────────────────┐         │  │
│  │  │        Frontend                         │         │  │
│  │  │   (Node.js 18-alpine)                  │         │  │
│  │  │                                         │         │  │
│  │  │ - React App (Production Build)         │         │  │
│  │  │ - Served via serve package             │         │  │
│  │  │ - Mobile Responsive CSS                │         │  │
│  │  │ - Health Check: /health                │         │  │
│  │  └─────────────────────────────────────────┘         │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │           Docker Volumes                     │   │  │
│  │  │                                              │   │  │
│  │  │ • project_3_backend_data → /app/data        │   │  │
│  │  │   (SQLite database persistence)             │   │  │
│  │  │                                              │   │  │
│  │  │ • project_3_nginx_cache → /var/cache/nginx  │   │  │
│  │  │   (HTTP caching)                            │   │  │
│  │  │                                              │   │  │
│  │  │ • project_3_nginx_logs → /var/log/nginx     │   │  │
│  │  │   (Nginx access/error logs)                 │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Docker Components

### 1. Backend Container

**Image**: `project_3-backend:latest`

**Dockerfile** (`server/Dockerfile`):
```dockerfile
# Multi-stage build for optimized production image
# Stage 1: Builder - Compiles dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
COPY . .

# Stage 2: Production Runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=512

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create directories with proper permissions
RUN mkdir -p /app/data /app/uploads && \
    chown -R nodejs:nodejs /app/data /app/uploads && \
    chmod 755 /app/data /app/uploads

USER nodejs
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "index.js"]
```

**Specifications**:
- **Base Image**: node:18-alpine (minimal Linux)
- **Size**: ~163MB
- **User**: nodejs (UID 1001, non-root)
- **Port**: 5000 (internal)
- **Health Check**: Every 30 seconds via `/api/health`
- **Memory**: 512MB max
- **Volumes**:
  - `/app/data` - SQLite database
  - `/app/uploads` - File uploads

---

### 2. Frontend Container

**Image**: `project_3-frontend:latest`

**Dockerfile** (`client/Dockerfile`):
```dockerfile
# Stage 1: Builder - React compilation
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runtime
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve@latest && npm cache clean --force

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/build ./build
USER nodejs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["serve", "-s", "build", "-l", "3000"]
```

**Specifications**:
- **Base Image**: node:18-alpine
- **Size**: ~144MB
- **Build Process**: Multi-stage (builder → runtime)
- **User**: nodejs (UID 1001, non-root)
- **Port**: 3000 (internal)
- **Serve Package**: Optimized static server
- **Health Check**: Every 30 seconds on `/`

---

### 3. Nginx Container

**Image**: `nginx:alpine`

**Key Configuration** (`nginx.conf`):
```nginx
# HTTP Server (port 80)
server {
    listen 80;
    server_name _;
    
    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server (port 443)
server {
    listen 443 ssl http2;
    server_name beananalytics.xyz www.beananalytics.xyz;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/beananalytics.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beananalytics.xyz/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 256;
    
    # Rate Limiting (auth endpoints)
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    
    # Backend Proxy
    location /api/ {
        limit_req zone=auth burst=5;
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend Proxy
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        error_page 404 =200 /index.html;
    }
}
```

**Specifications**:
- **Base Image**: nginx:alpine
- **Ports**: 80 (HTTP) → 443 (HTTPS)
- **SSL Provider**: Let's Encrypt with auto-renewal
- **Features**:
  - HTTP/2 support
  - Gzip compression
  - Rate limiting
  - Security headers
  - Reverse proxying
  - Static asset caching

---

## File Structure

```
project_3/
├── docker-compose.yml          ← Container orchestration
├── nginx.conf                  ← Nginx reverse proxy config
├── .env.production             ← Production environment variables
│
├── server/
│   ├── Dockerfile              ← Backend image definition
│   ├── package.json
│   ├── index.js               ← Express server entry point
│   ├── routes/
│   │   ├── auth.js            ← Authentication endpoints
│   │   ├── files.js           ← File upload endpoints
│   │   ├── analytics.js       ← Analytics endpoints
│   │   └── data.js            ← Data processing endpoints
│   ├── services/
│   │   ├── analyticsService.js
│   │   └── etlProcessor.js
│   ├── database/
│   │   └── db.js              ← SQLite connection (FIXED)
│   └── config.js              ← Configuration management
│
├── client/
│   ├── Dockerfile              ← Frontend image definition
│   ├── package.json
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── Sidebar.js (FIXED - mobile responsive)
│   │   │   ├── VerticalNav.js (FIXED - logout visible)
│   │   │   ├── AddFile.js (FIXED - button overflow)
│   │   │   └── *.css (FIXED - responsive design)
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   └── *.js
│   │   └── context/
│   │       └── AuthContext.js
│   └── public/
│
└── volumes/
    ├── backend_data/           ← SQLite database persistence
    ├── nginx_cache/            ← HTTP cache storage
    └── nginx_logs/             ← Access/error logs
```

---

## Build & Deployment

### Build Backend Image

```bash
# Build image on EC2
ssh ec2-user@13.221.255.219
cd ~/project_3/server
sudo docker build -t project_3-backend .

# Verify build
sudo docker images | grep project_3-backend
# Output: project_3-backend  latest  XXXXXXX  163MB
```

### Build Frontend Image

```bash
# Build image on EC2
cd ~/project_3/client
sudo docker build -t project_3-frontend .

# Verify build
sudo docker images | grep project_3-frontend
# Output: project_3-frontend  latest  XXXXXXX  144MB
```

### Start All Services

```bash
# Navigate to project directory
cd ~/project_3

# Start all containers
sudo docker-compose up -d

# Verify containers running
sudo docker-compose ps

# Expected output:
# NAME                 IMAGE                    STATUS
# analytics-backend    project_3-backend:latest Up (healthy)
# analytics-frontend   project_3-frontend:latest Up (healthy)
# analytics-nginx      nginx:alpine             Up (healthy)
```

---

## Container Management

### View Container Logs

```bash
# Backend logs
sudo docker logs analytics-backend -f

# Frontend logs
sudo docker logs analytics-frontend -f

# Nginx logs
sudo docker logs analytics-nginx -f

# All containers
sudo docker-compose logs -f
```

### Restart Services

```bash
# Restart specific service
sudo docker-compose restart backend
sudo docker-compose restart frontend
sudo docker-compose restart nginx

# Restart all services
sudo docker-compose restart

# Stop all services
sudo docker-compose stop

# Start all services
sudo docker-compose start

# Full restart (stop and start)
sudo docker-compose down
sudo docker-compose up -d
```

### Execute Commands in Container

```bash
# Access backend shell
sudo docker exec -it analytics-backend sh

# Check database
sudo docker exec analytics-backend ls -la /app/data

# View environment variables
sudo docker exec analytics-backend env | grep NODE_ENV
```

### Monitor Resource Usage

```bash
# CPU and memory usage
sudo docker stats

# Container details
sudo docker inspect analytics-backend
```

---

## Volumes & Data

### Volume Configuration

**docker-compose.yml**:
```yaml
volumes:
  backend_data:
    driver: local
  nginx_cache:
    driver: local
  nginx_logs:
    driver: local
```

### Data Persistence

| Volume | Purpose | Mount Point | Host Path |
|--------|---------|-------------|-----------|
| `backend_data` | SQLite db | `/app/data` | `/var/lib/docker/volumes/project_3_backend_data/_data` |
| `nginx_cache` | HTTP cache | `/var/cache/nginx` | `/var/lib/docker/volumes/project_3_nginx_cache/_data` |
| `nginx_logs` | Access logs | `/var/log/nginx` | `/var/lib/docker/volumes/project_3_nginx_logs/_data` |

### Database Backup

```bash
# Backup SQLite database
sudo docker cp analytics-backend:/app/data/analytics.db ./backup/analytics_$(date +%Y%m%d).db

# Restore from backup
sudo docker cp ./backup/analytics.db analytics-backend:/app/data/
```

---

## Networking

### Network Configuration

```yaml
# docker-compose.yml
networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Discovery

- **Backend**: `http://backend:5000` (from nginx/frontend)
- **Frontend**: `http://frontend:3000` (from nginx)
- **Nginx**: Listens on host ports 80/443

### Port Mapping

```yaml
services:
  nginx:
    ports:
      - "80:80"        # HTTP traffic
      - "443:443"      # HTTPS traffic
  backend:
    expose:
      - "5000"         # Internal only
  frontend:
    expose:
      - "3000"         # Internal only
```

---

## SSL/TLS Configuration

### Certificate Setup

```bash
# Generate Let's Encrypt certificate
sudo bash ~/project_3/setup-ssl.sh

# Certificate location
/etc/letsencrypt/live/beananalytics.xyz/
├── fullchain.pem    # Certificate chain
├── privkey.pem      # Private key
├── cert.pem         # Current certificate
└── chain.pem        # Issuer chain
```

### Docker Volume Mount

```yaml
# docker-compose.yml
services:
  nginx:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

### HTTPS Features

| Feature | Status | Details |
|---------|--------|---------|
| SSL/TLS 1.2+ | ✅ | High security ciphers |
| HTTP/2 | ✅ | Faster protocol |
| HSTS | ✅ | 1 year max-age |
| HTTP→HTTPS | ✅ | Automatic redirect |
| Auto-renewal | ✅ | Certbot scheduled |

---

## Environment Variables

### Backend (.env.production)

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_PATH=/app/data/analytics.db

# Authentication
JWT_SECRET=a9b019b039e73839da588ae19931813d0d5ebe90afa2d82dee68fcc4a54a0130
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=https://beananalytics.xyz,https://www.beananalytics.xyz

# Frontend API URL
REACT_APP_API_URL=https://beananalytics.xyz/api

# File Upload
MAX_FILE_SIZE=52428800  # 50MB

# Security
ENABLE_RATE_LIMITING=true

# Logging
LOG_LEVEL=info
```

### Frontend (.env)

```bash
# API Configuration
REACT_APP_API_URL=https://beananalytics.xyz/api

# Build
REACT_APP_ENV=production
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
sudo docker logs analytics-backend

# Common issues:
# 1. Port already in use
#    Solution: sudo lsof -i :5000 && kill -9 <PID>

# 2. Volume permission denied
#    Solution: sudo docker exec analytics-backend ls -la /app/data

# 3. Out of disk space
#    Solution: sudo docker system prune -a
```

### Database Connection Failed

```bash
# Check if database file exists
sudo docker exec analytics-backend ls -la /app/data/

# Fix permissions if needed
sudo docker exec analytics-backend chmod 755 /app/data

# Restart backend
sudo docker-compose restart backend
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Verify nginx config
sudo docker exec analytics-nginx nginx -t

# Reload nginx
sudo docker exec analytics-nginx nginx -s reload
```

### Memory/CPU Issues

```bash
# Check resource usage
sudo docker stats

# View resource limits
sudo docker inspect analytics-backend | grep -i memory

# Increase container limits (docker-compose.yml):
# deploy:
#   resources:
#     limits:
#       cpus: '2'
#       memory: 2G
```

---

## Production Checklist

### Before Deployment

- ✅ Docker installed on EC2
- ✅ Docker Compose v5.0.2+ installed
- ✅ SSL certificates generated (Let's Encrypt)
- ✅ Environment variables configured
- ✅ Database initialized (SQLite)
- ✅ File upload directory created
- ✅ Health checks configured
- ✅ Nginx reverse proxy configured
- ✅ Security headers enabled
- ✅ Rate limiting enabled

### After Deployment

- ✅ All containers running and healthy
- ✅ Health checks passing
- ✅ SSL/HTTPS working
- ✅ Database connected (no READONLY errors)
- ✅ File uploads working
- ✅ Authentication system working
- ✅ Logs accessible
- ✅ Monitoring active

### Ongoing Maintenance

- ✅ Monitor container logs daily
- ✅ Check disk space weekly
- ✅ Verify SSL certificate status monthly
- ✅ Backup database regularly
- ✅ Update Docker images quarterly
- ✅ Review security headers annually

---

## Quick Reference Commands

```bash
# View all containers
sudo docker-compose ps

# View logs
sudo docker-compose logs -f [service]

# Restart service
sudo docker-compose restart [service]

# Rebuild image
cd ~/project_3/[server|client]
sudo docker build -t project_3-[backend|frontend] .

# Stop all
sudo docker-compose stop

# Start all
sudo docker-compose up -d

# View container stats
sudo docker stats

# Execute shell in container
sudo docker exec -it analytics-backend sh

# Prune unused images
sudo docker system prune -a

# View volume info
sudo docker volume ls
sudo docker volume inspect project_3_backend_data
```

---

## Summary

✅ **3 Production-Grade Containers**
- Backend: Node.js/Express with SQLite
- Frontend: React production build
- Nginx: SSL/TLS reverse proxy

✅ **Security Features**
- Non-root users
- SSL/HTTPS encryption
- Rate limiting
- Security headers
- Isolated network

✅ **Reliability**
- Health checks (every 30s)
- Auto-restart on failure
- Persistent data volumes
- Comprehensive logging

✅ **Scalability**
- Modular container design
- Easy to add/scale services
- Portable across environments
- Version-controlled infrastructure

---

**Status**: 🟢 Production Ready  
**Last Update**: February 17, 2026  
**Deployment**: AWS EC2 (13.221.255.219)  
**Access**: https://www.beananalytics.xyz
