# 🚀 EC2 Docker Deployment Guide

Complete guide to deploy your Dockerized E-Commerce Analytics Platform to AWS EC2.

---

## 📋 Prerequisites

- ✅ AWS EC2 instance running (13.221.255.219)
- ✅ SSH key: `C:\Users\nagar\Downloads\key-mern.pem`
- ✅ Domain: `beananalytics.xyz` pointing to EC2 IP
- ✅ Docker project ready locally

---

## 🛑 STEP 1: Stop Old PM2 + Nginx Setup on EC2

### Connect to EC2
```bash
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219
```

### Stop Old Services
```bash
# Stop PM2 processes
pm2 delete all
pm2 kill

# Stop old Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Optional: Remove old nginx config
sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Verify nothing is running on port 80
sudo netstat -tulpn | grep :80
```

---

## 🐳 STEP 2: Install Docker on EC2

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (no sudo needed)
sudo usermod -aG docker ec2-user

# Apply group changes (IMPORTANT: logout and login again)
exit
```

### Reconnect and Verify
```bash
# SSH back in
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Verify Docker installation
docker --version
docker ps

# Test Docker
docker run hello-world
```

---

## 🐳 STEP 3: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink (optional, for easier access)
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify installation
docker-compose --version
```

Expected output: `Docker Compose version v2.x.x`

---

## 📦 STEP 4: Upload Project to EC2

### Method 1: SCP (Direct Upload) - RECOMMENDED FOR QUICK DEPLOYMENT

#### From Windows PowerShell:
```powershell
# Navigate to project directory
cd C:\Users\nagar\OneDrive\Desktop\project_3\E-Commerce_Analytics_Platform-main

# Create deployment package (exclude node_modules)
Compress-Archive -Path project_3\* -DestinationPath project_3.zip

# Upload to EC2
scp -i "C:\Users\nagar\Downloads\key-mern.pem" project_3.zip ec2-user@13.221.255.219:/home/ec2-user/
```

#### On EC2:
```bash
# Unzip project
unzip project_3.zip -d project_3

# Navigate to project
cd ~/project_3

# Verify structure
ls -la
```

### Method 2: Git Clone (Cleaner) - RECOMMENDED FOR VERSION CONTROL

#### On Local Machine:
```bash
# Initialize git (if not already)
cd project_3
git init
git add .
git commit -m "Docker deployment ready"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-analytics.git
git push -u origin main
```

#### On EC2:
```bash
# Clone repository
cd ~
git clone https://github.com/YOUR_USERNAME/ecommerce-analytics.git project_3
cd project_3

# Or pull latest changes
git pull origin main
```

---

## 🔧 STEP 5: Configure for Production

### Update Environment Variables
```bash
cd ~/project_3

# Edit .env file
nano .env
```

**Update these values:**
```env
# Production Mode
NODE_ENV=production

# Domain Configuration
CORS_ORIGIN=https://beananalytics.xyz,https://www.beananalytics.xyz
REACT_APP_API_URL=https://beananalytics.xyz/api

# Ports (use default)
HTTP_PORT=80
HTTPS_PORT=443
BACKEND_PORT=5000

# JWT Secret (IMPORTANT: Use your existing or generate new)
JWT_SECRET=your_actual_production_jwt_secret_here

# Database
DATABASE_PATH=/app/data/analytics.db

# Rate Limiting
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Update Nginx Configuration (Already Done in nginx.conf)

The nginx.conf is already configured for:
- ✅ HTTP server on port 80
- ✅ Rate limiting
- ✅ Security headers
- ✅ Gzip compression
- ✅ Reverse proxy to backend/frontend

---

## 🚀 STEP 6: Build and Start Docker Containers

```bash
cd ~/project_3

# Build images (first time or after code changes)
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Expected Output:**
```
NAME                 IMAGE                COMMAND                  SERVICE    STATUS
analytics-nginx      nginx:alpine         "/docker-entrypoint.…"   nginx      Up (healthy)
analytics-backend    project_3-backend    "docker-entrypoint.s…"   backend    Up (healthy)
analytics-frontend   project_3-frontend   "docker-entrypoint.s…"   frontend   Up (healthy)
```

---

## 🔒 STEP 7: Configure EC2 Security Group

### AWS Console Steps:

1. **Go to EC2 Dashboard** → **Security Groups**
2. **Select your instance's security group**
3. **Edit Inbound Rules** → **Add Rules:**

| Type       | Protocol | Port Range | Source    | Description          |
|------------|----------|------------|-----------|----------------------|
| HTTP       | TCP      | 80         | 0.0.0.0/0 | Allow HTTP traffic   |
| HTTPS      | TCP      | 443        | 0.0.0.0/0 | Allow HTTPS traffic  |
| Custom TCP | TCP      | 22         | Your IP   | SSH access           |

4. **Save Rules**

### Or Using AWS CLI:
```bash
# Get security group ID
aws ec2 describe-instances --instance-ids i-YOUR-INSTANCE-ID \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTP rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR-GROUP-ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Add HTTPS rule
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR-GROUP-ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## 🌐 STEP 8: Configure Domain DNS

### Update DNS Records (Your Domain Provider):

| Type  | Name | Value            | TTL  |
|-------|------|------------------|------|
| A     | @    | 13.221.255.219   | 3600 |
| A     | www  | 13.221.255.219   | 3600 |

**Wait 5-15 minutes for DNS propagation.**

### Verify DNS:
```bash
# Check DNS resolution
nslookup beananalytics.xyz
dig beananalytics.xyz

# Test from EC2
curl -I http://beananalytics.xyz
```

---

## 🔐 STEP 9: Setup SSL/HTTPS (Let's Encrypt)

### Install Certbot
```bash
# On EC2
sudo yum install certbot python3-certbot-nginx -y
```

### Generate SSL Certificate
```bash
# Stop Docker temporarily (certbot needs port 80)
cd ~/project_3
docker-compose down

# Generate certificate
sudo certbot certonly --standalone \
  -d beananalytics.xyz \
  -d www.beananalytics.xyz \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Certificates will be at:
# /etc/letsencrypt/live/beananalytics.xyz/fullchain.pem
# /etc/letsencrypt/live/beananalytics.xyz/privkey.pem
```

### Copy Certificates to Project
```bash
# Copy certificates to nginx/ssl directory
sudo cp /etc/letsencrypt/live/beananalytics.xyz/fullchain.pem ~/project_3/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/beananalytics.xyz/privkey.pem ~/project_3/nginx/ssl/key.pem

# Set ownership
sudo chown ec2-user:ec2-user ~/project_3/nginx/ssl/*.pem
chmod 644 ~/project_3/nginx/ssl/cert.pem
chmod 600 ~/project_3/nginx/ssl/key.pem
```

### Update nginx.conf for HTTPS
```bash
cd ~/project_3
nano nginx.conf
```

**Uncomment HTTPS server block** (lines currently commented for HTTP-only testing).

### Restart with SSL
```bash
docker-compose up -d
```

### Setup Auto-Renewal
```bash
# Add cron job for renewal
sudo crontab -e

# Add this line:
0 0 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/beananalytics.xyz/*.pem /home/ec2-user/project_3/nginx/ssl/ && cd /home/ec2-user/project_3 && docker-compose restart nginx
```

---

## ✅ STEP 10: Verification

### Test All Endpoints:

```bash
# From EC2
curl http://beananalytics.xyz/health
curl http://beananalytics.xyz/api/health

# Expected: {"status":"OK","message":"Server is running"}

# From browser
http://beananalytics.xyz/
```

### Check Container Health:
```bash
docker-compose ps
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Monitor Resources:
```bash
docker stats
htop
df -h  # Check disk space
free -h  # Check memory
```

---

## 🔄 Common Deployment Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nginx
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart nginx
```

### Update After Code Changes
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or without downtime (if possible)
docker-compose up -d --build --no-deps --force-recreate nginx
```

### Stop All Services
```bash
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

### Backup Database
```bash
# Backup SQLite database
docker cp analytics-backend:/app/data/analytics.db ~/backups/analytics-$(date +%Y%m%d).db

# Create backup directory
mkdir -p ~/backups
```

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 80
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 <PID>

# Or stop old nginx
sudo systemctl stop nginx
```

### Docker Permission Denied
```bash
# Add user to docker group
sudo usermod -aG docker ec2-user

# Logout and login
exit
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219
```

### Containers Not Starting
```bash
# View detailed logs
docker-compose logs

# Check configuration
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Out of Disk Space
```bash
# Clean up Docker
docker system prune -a
docker volume prune

# Check disk usage
df -h
du -sh /var/lib/docker
```

### DNS Not Resolving
```bash
# Check DNS
nslookup beananalytics.xyz

# Wait for propagation (up to 48 hours)
# Or flush local DNS
sudo systemd-resolve --flush-caches
```

---

## 📊 Monitoring & Maintenance

### Setup Monitoring
```bash
# Install htop for resource monitoring
sudo yum install htop -y

# Monitor in real-time
htop
docker stats
```

### Log Rotation (Prevent disk full)
```bash
# Create log rotation config
sudo nano /etc/logrotate.d/docker-compose

# Add:
/home/ec2-user/project_3/data/nginx/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
}
```

### Automated Backups
```bash
# Create backup script
nano ~/backup.sh

# Add:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker cp analytics-backend:/app/data/analytics.db ~/backups/analytics-$DATE.db
find ~/backups -name "analytics-*.db" -mtime +7 -delete

# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /home/ec2-user/backup.sh
```

---

## 🎯 Performance Optimization

### Increase Docker Resources
```bash
# Edit docker daemon config
sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
docker-compose up -d
```

### Enable Swap (if low memory)
```bash
# Create swap file (2GB)
sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📚 Quick Reference

### Essential Commands
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Restart after changes
docker-compose up -d --build

# Access container shell
docker exec -it analytics-backend sh

# View container details
docker inspect analytics-nginx
```

### File Locations
```
~/project_3/                          # Project root
~/project_3/.env                      # Environment variables
~/project_3/docker-compose.yml        # Orchestration config
~/project_3/nginx.conf                # Nginx configuration
~/project_3/nginx/ssl/                # SSL certificates
~/project_3/data/backend/             # Database location
~/project_3/data/nginx/logs/          # Nginx logs
```

---

## ✅ Deployment Checklist

- [ ] Old PM2 processes stopped
- [ ] Old Nginx stopped
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Project uploaded to EC2
- [ ] .env file updated with production values
- [ ] EC2 Security Group configured (ports 80, 443)
- [ ] DNS records pointing to EC2 IP
- [ ] All containers running and healthy
- [ ] Health endpoints responding
- [ ] Frontend accessible via domain
- [ ] Backend API responding
- [ ] SSL certificates installed (optional)
- [ ] HTTPS working (optional)
- [ ] Auto-renewal configured (optional)
- [ ] Monitoring setup
- [ ] Backups configured

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ `docker-compose ps` shows all containers as **healthy**  
✅ `curl http://beananalytics.xyz/health` returns `healthy`  
✅ `curl http://beananalytics.xyz/api/health` returns JSON  
✅ Browser: `http://beananalytics.xyz` shows your React app  
✅ No errors in `docker-compose logs`  

---

**🚀 You're now running a production-grade Dockerized SaaS platform on AWS EC2!**

*Last Updated: February 17, 2026*
