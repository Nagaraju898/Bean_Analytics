# 🚀 EC2 Docker Deployment - Quick Reference

## 📝 Quick Start (Single Command Deployment)

### From Windows:
```powershell
# Run automated deployment
.\deploy-to-ec2.ps1
```

### From EC2:
```bash
# Run deployment script
cd ~/project_3
./ec2-deploy.sh

# With SSL
./ec2-deploy.sh --ssl
```

---

## 🔑 SSH Access

```bash
# Connect to EC2
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Or set environment variable (Windows)
$env:SSH_KEY = "C:\Users\nagar\Downloads\key-mern.pem"
$env:EC2_HOST = "13.221.255.219"
ssh -i $env:SSH_KEY ec2-user@$env:EC2_HOST
```

---

## 📦 Manual Upload Methods

### Method 1: SCP (Recommended)
```powershell
# From Windows PowerShell
scp -i "C:\Users\nagar\Downloads\key-mern.pem" -r project_3 ec2-user@13.221.255.219:/home/ec2-user/
```

### Method 2: Git (Clean)
```bash
# On local machine
cd project_3
git init
git add .
git commit -m "Docker deployment"
git push origin main

# On EC2
git clone https://github.com/YOUR_USERNAME/repo.git project_3
```

### Method 3: Archive + Upload
```powershell
# Create archive (Windows)
Compress-Archive -Path project_3\* -DestinationPath project_3.zip

# Upload
scp -i "C:\Users\nagar\Downloads\key-mern.pem" project_3.zip ec2-user@13.221.255.219:~/

# On EC2
unzip project_3.zip -d project_3
cd project_3
```

---

## 🛑 Stop Old Services

```bash
# SSH to EC2
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Stop PM2
pm2 delete all
pm2 kill

# Stop Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Verify port 80 is free
sudo netstat -tulpn | grep :80
```

---

## 🐳 Docker Installation

```bash
# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# IMPORTANT: Logout and login
exit

# Reconnect
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Verify
docker --version
docker ps
```

---

## 🐳 Docker Compose Installation

```bash
# Install
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Verify
docker-compose --version
```

---

## 🚀 Build and Deploy

```bash
cd ~/project_3

# Build all images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🔍 Monitoring & Logs

```bash
# Container status
docker-compose ps
docker ps

# All logs (follow mode)
docker-compose logs -f

# Specific service logs
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100

# Resource usage
docker stats

# System usage
htop
df -h
free -h
```

---

## 🔄 Common Operations

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart nginx
docker-compose restart backend
```

### Update After Code Changes
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or without full shutdown
docker-compose up -d --build --no-deps backend
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Scale Services
```bash
# Scale backend (multiple instances)
docker-compose up -d --scale backend=3

# Verify
docker-compose ps
```

---

## 🔒 Security Group Configuration

### Required Ports:
| Port | Protocol | Source    | Description |
|------|----------|-----------|-------------|
| 22   | TCP      | Your IP   | SSH         |
| 80   | TCP      | 0.0.0.0/0 | HTTP        |
| 443  | TCP      | 0.0.0.0/0 | HTTPS       |

### AWS CLI:
```bash
# Get security group ID
aws ec2 describe-instances --instance-ids i-YOUR-ID \
  --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId'

# Add HTTP
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR-ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Add HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-YOUR-ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

---

## 🌐 DNS Configuration

### A Records:
| Type | Name | Value          | TTL  |
|------|------|----------------|------|
| A    | @    | 13.221.255.219 | 3600 |
| A    | www  | 13.221.255.219 | 3600 |

### Verify DNS:
```bash
nslookup beananalytics.xyz
dig beananalytics.xyz
```

---

## 🔐 SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo yum install certbot -y

# Stop containers (certbot needs port 80)
cd ~/project_3
docker-compose down

# Generate certificate
sudo certbot certonly --standalone \
  -d beananalytics.xyz \
  -d www.beananalytics.xyz \
  --email your-email@example.com \
  --agree-tos

# Copy to project
sudo cp /etc/letsencrypt/live/beananalytics.xyz/fullchain.pem ~/project_3/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/beananalytics.xyz/privkey.pem ~/project_3/nginx/ssl/key.pem
sudo chown ec2-user:ec2-user ~/project_3/nginx/ssl/*.pem
chmod 644 ~/project_3/nginx/ssl/cert.pem
chmod 600 ~/project_3/nginx/ssl/key.pem

# Restart with SSL
docker-compose up -d

# Setup auto-renewal
sudo crontab -e
# Add line:
0 0 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/beananalytics.xyz/*.pem /home/ec2-user/project_3/nginx/ssl/ && cd /home/ec2-user/project_3 && docker-compose restart nginx
```

---

## ✅ Verification Checklist

```bash
# Test health endpoint
curl http://beananalytics.xyz/health
# Expected: healthy

# Test API
curl http://beananalytics.xyz/api/health
# Expected: {"status":"OK","message":"Server is running"}

# Test frontend (in browser)
http://beananalytics.xyz/

# Check all containers healthy
docker-compose ps
# All should show (healthy)

# Check logs for errors
docker-compose logs | grep -i error
```

---

## 💾 Backup & Restore

### Backup Database:
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker cp analytics-backend:/app/data/analytics.db ~/backups/analytics-$(date +%Y%m%d).db

# Automated backup (cron)
crontab -e
# Add:
0 2 * * * docker cp analytics-backend:/app/data/analytics.db ~/backups/analytics-$(date +%Y%m%d).db
```

### Restore Database:
```bash
# Copy backup to container
docker cp ~/backups/analytics-20260217.db analytics-backend:/app/data/analytics.db

# Restart backend
docker-compose restart backend
```

---

## 🆘 Troubleshooting

### Container Not Starting:
```bash
# View detailed logs
docker-compose logs [service-name]

# Check configuration
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use:
```bash
# Find process using port 80
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 <PID>

# Or stop old nginx
sudo systemctl stop nginx
```

### Out of Disk Space:
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a
docker volume prune

# Remove old images
docker image prune -a
```

### Permission Denied:
```bash
# Add user to docker group
sudo usermod -aG docker ec2-user

# Logout and login
exit
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219
```

---

## 🔧 Configuration Files

### Update .env for Production:
```bash
nano ~/project_3/.env

# Change:
NODE_ENV=production
CORS_ORIGIN=https://beananalytics.xyz,https://www.beananalytics.xyz
REACT_APP_API_URL=https://beananalytics.xyz/api
```

### Update Docker Compose:
```bash
nano ~/project_3/docker-compose.yml

# Verify ports are correct:
# nginx: 80:80, 443:443
# backend: expose 5000
# frontend: expose 3000
```

---

## 📊 Performance Monitoring

```bash
# Container resource usage
docker stats

# System resources
htop

# Disk usage
df -h
du -sh ~/project_3/*

# Memory usage
free -h

# Network connections
sudo netstat -tulpn

# Process list
ps aux | grep docker
```

---

## 🔄 Update Deployment Workflow

### From Windows (Automated):
```powershell
# Make changes to code
# Run deployment script
.\deploy-to-ec2.ps1
```

### Manual Update:
```bash
# 1. On local machine - commit changes
git add .
git commit -m "Update"
git push origin main

# 2. On EC2 - pull and rebuild
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219
cd ~/project_3
git pull origin main
docker-compose up -d --build
```

---

## 📚 Important Paths

```bash
# Project root
~/project_3/

# Environment variables
~/project_3/.env

# Docker Compose config
~/project_3/docker-compose.yml

# Nginx config
~/project_3/nginx.conf

# SSL certificates
~/project_3/nginx/ssl/

# Database
~/project_3/data/backend/analytics.db

# Logs
~/project_3/data/nginx/logs/
```

---

## 🎯 One-Liners

```bash
# Quick deployment
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219 "cd ~/project_3 && ./ec2-deploy.sh"

# Quick restart
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219 "cd ~/project_3 && docker-compose restart"

# Quick logs
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219 "cd ~/project_3 && docker-compose logs -f"

# Quick status
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219 "cd ~/project_3 && docker-compose ps"

# Update and redeploy
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219 "cd ~/project_3 && git pull && docker-compose up -d --build"
```

---

**🚀 Quick Reference Guide - Keep this handy for daily operations!**
