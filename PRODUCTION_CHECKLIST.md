# Production Checklist & Deployment Guide

Complete this checklist before deploying to production.

## Pre-Deployment

### Security
- [ ] Update `JWT_SECRET` in `.env` with a strong random key (min 32 characters)
- [ ] Update `DB_PASSWORD` with a strong password
- [ ] Generate SSL certificates (see `nginx/ssl/README.md`)
- [ ] Review nginx.conf security headers
- [ ] Enable firewall (UFW on Linux)
- [ ] Set resource limits in docker-compose.yml
- [ ] Remove debug mode from backend
- [ ] Disable verbose logging in production

### Application Configuration
- [ ] Update `REACT_APP_API_URL` to your production domain
- [ ] Update `CORS_ORIGIN` to allowed domains
- [ ] Configure email settings if needed
- [ ] Set up error tracking (Sentry optional)
- [ ] Configure S3/storage if using
- [ ] Review database connection string
- [ ] Set `NODE_ENV=production`
- [ ] Verify all environment variables in `.env`

### Infrastructure
- [ ] Provision server (AWS EC2, DigitalOcean, Linode, etc.)
- [ ] Configure DNS records pointing to server
- [ ] Install Docker and Docker Compose
- [ ] Create `/opt/app` directory structure
- [ ] Set up firewall rules:
  - [ ] Allow port 80 (HTTP)
  - [ ] Allow port 443 (HTTPS)
  - [ ] Allow port 22 (SSH) - restricted source
- [ ] Configure swap space (2GB recommended)
- [ ] Set up automated backups
- [ ] Configure monitoring (DataDog, New Relic, etc. - optional)

### Domain & SSL
- [ ] Domain registered and configured
- [ ] DNS propagated (verify with `dig`)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Certificate auto-renewal configured
- [ ] Tested HTTPS access

### Backups
- [ ] Set up daily database backups
- [ ] Test backup restoration procedure
- [ ] Backup encryption configured
- [ ] Off-site backup storage configured

## Deployment Process

### 1. Initial Deployment

```bash
# SSH into server
ssh root@your-server-ip

# Clone repository
git clone <your-repo-url> /opt/app
cd /opt/app

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Generate SSL certificates (if using Let's Encrypt)
sudo certbot certonly --standalone -d your-domain.com
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chmod 644 nginx/ssl/cert.pem
sudo chmod 600 nginx/ssl/key.pem

# Build and start services
docker-compose build
docker-compose up -d

# Verify deployment
docker-compose ps
curl https://your-domain.com/health
```

### 2. Post-Deployment Verification

```bash
# [ ] Check all services running
docker-compose ps

# [ ] Test health endpoints
curl http://localhost/health
curl https://your-domain.com/health

# [ ] Check logs for errors
docker-compose logs --tail=50

# [ ] Test API endpoints
curl https://your-domain.com/api/health

# [ ] Test frontend loads
curl https://your-domain.com

# [ ] Check SSL certificate
openssl s_client -connect your-domain.com:443

# [ ] Load test with small traffic
ab -n 100 -c 10 https://your-domain.com/
```

### 3. Production Hardening

```bash
# [ ] Set up firewall
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# [ ] Create non-root user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo su - deploy

# [ ] Configure log rotation
cat > /etc/logrotate.d/docker-containers << EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  delaycompress
  missingok
}
EOF

# [ ] Configure swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# [ ] Enable automatic security updates
sudo apt-get update
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Continuous Integration / Deployment

#### Option A: GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/app
            git pull origin main
            docker-compose build
            docker-compose up -d
            docker-compose exec -T backend npm run migrate
            docker-compose logs --tail=20
```

#### Option B: Webhook Deployment

```bash
# Create deployment webhook script
cat > /opt/app/deploy-webhook.sh << 'EOF'
#!/bin/bash
cd /opt/app
git pull origin main
docker-compose build
docker-compose up -d
docker-compose exec -T backend npm run migrate
EOF

chmod +x /opt/app/deploy-webhook.sh
```

## Monitoring & Maintenance

### Daily Checks
- [ ] All containers running: `docker-compose ps`
- [ ] No memory issues: `docker stats`
- [ ] No disk space issues: `df -h`
- [ ] Check error logs: `docker-compose logs --since 24h --level error`

### Weekly Tasks
- [ ] Review application logs
- [ ] Check SSL certificate expiration
- [ ] Verify backups completed
- [ ] Monitor server performance
- [ ] Check for security updates

### Monthly Tasks
- [ ] Full backup test
- [ ] Performance analysis
- [ ] Security audit
- [ ] Dependency updates
- [ ] Documentation review

### Monitoring Commands

```bash
# Monitor resource usage
watch -n 1 'docker stats'

# Monitor logs in real-time
docker-compose logs -f

# Check certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Check disk space
du -sh /var/lib/docker/volumes/*
du -sh /opt/app

# View container resource limits
docker inspect $(docker-compose ps -q backend) | grep -A 5 "Memory"
```

## Scaling & Performance

### Increase Backend Instances

```bash
# Scale to 3 instances
docker-compose up -d --scale backend=3 backend

# Nginx automatically load balances
# Check nginx upstream configuration
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep -A 5 "upstream backend"
```

### Database Optimization

```bash
# Connect to SQLite
docker-compose exec backend sqlite3 /app/data/analytics.db

# Vacuum database
sqlite> VACUUM;
sqlite> ANALYZE;

# Backup database
docker-compose exec backend sqlite3 /app/data/analytics.db ".dump" > backup.sql
```

### Cache Configuration

Uncomment Redis in docker-compose.yml:

```yaml
redis:
  image: redis:7-alpine
  container_name: analytics-redis
```

Then update backend to use Redis for sessions.

## Troubleshooting

### Container Crashes on Startup

```bash
# Check logs
docker-compose logs backend

# Rebuild
docker-compose build --no-cache backend

# Check environment
docker-compose config

# Test connection
docker-compose exec backend env | grep -i database
```

### High Memory Usage

```bash
# Identify leaking containers
docker stats

# Restart container
docker-compose restart backend

# Check memory limits
docker inspect $(docker-compose ps -q backend) | grep Memory
```

### Database Issues

```bash
# Check SQLite status
docker-compose exec backend sqlite3 /app/data/analytics.db "PRAGMA integrity_check;"

# Backup and reset
docker-compose exec backend cp /app/data/analytics.db /app/data/backup.db
docker-compose restart backend

# Restore if needed
docker-compose exec backend cp /app/data/backup.db /app/data/analytics.db
```

### SSL Certificate Issues

```bash
# Check certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check private key
openssl rsa -in nginx/ssl/key.pem -check

# Renew Let's Encrypt certificate
sudo certbot renew --quiet

# Restart nginx after renewal
docker-compose restart nginx
```

## Disaster Recovery

### Complete Backup

```bash
# Backup all data and configuration
tar -czf backup-$(date +%Y%m%d).tar.gz \
  /opt/app/.env \
  /opt/app/server/data \
  /opt/app/nginx/ssl
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backup-20240101.tar.gz

# Restart services
docker-compose down
docker-compose up -d

# Verify
docker-compose ps
```

### Database Migration

When moving to production database:

```bash
# Dump SQLite data
docker-compose exec backend sqlite3 /app/data/analytics.db ".dump" > dump.sql

# Create PostgreSQL database
docker-compose exec db psql -U analytics -d analytics_db < schema.sql

# Import data
docker-compose exec db psql -U analytics -d analytics_db < dump.sql
```

## Rollback Procedure

If deployment causes issues:

```bash
# Revert to previous version
cd /opt/app
git revert HEAD
git push origin main

# Or go back to specific commit
git checkout <commit-hash>
git push -f origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Verify
docker-compose ps
curl https://your-domain.com/health
```

## Performance Optimization Checklist

- [ ] Gzip enabled in nginx
- [ ] Static asset caching configured
- [ ] API response-time monitoring enabled
- [ ] Database queries optimized
- [ ] Image optimization implemented
- [ ] CDN configured (optional)
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Rate limiting enabled
- [ ] Load testing completed

## Compliance & Security Checklist

- [ ] GDPR compliance reviewed
- [ ] Data encryption at rest configured
- [ ] Data encryption in transit (TLS) enabled
- [ ] Access logs monitored
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection protection confirmed
- [ ] XSS protection enabled
- [ ] CSRF protection implemented
- [ ] Principle of least privilege applied
- [ ] Secrets management reviewed
- [ ] Audit logging enabled

## Contact & Support

For deployment issues:
1. Check container logs: `docker-compose logs`
2. Review DOCKER.md documentation
3. Check service health: `docker-compose ps`
4. Monitor system resources: `docker stats`
5. Review error tracking service (if configured)

