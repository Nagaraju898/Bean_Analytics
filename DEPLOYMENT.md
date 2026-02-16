# Bean Analytics - Deployment Guide

## 🚀 Quick Deployment

### Prerequisites
- Windows PowerShell
- SSH access to EC2 instance
- Domain DNS pointing to EC2 IP

### One-Command Deployment

```powershell
.\deploy.ps1
```

This script will:
1. ✅ Build the React application
2. ✅ Create deployment package
3. ✅ Transfer files to EC2
4. ✅ Install dependencies
5. ✅ Configure nginx
6. ✅ Start application with PM2
7. ✅ Configure firewall

---

## 📋 Deployment Information

**EC2 Instance:**
- IP: `13.221.255.219`
- User: `ec2-user`
- Key: `C:\Users\nagar\Downloads\key-mern.pem`

**Domain:**
- Primary: `https://beananalytics.xyz`
- WWW: `https://www.beananalytics.xyz`

**Application:**
- Backend Port: `5000`
- Process Manager: PM2
- Web Server: Nginx
- Database: SQLite

---

## 🔒 SSL Certificate Setup

After deployment, set up HTTPS:

```bash
# SSH into EC2
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d beananalytics.xyz -d www.beananalytics.xyz

# Follow prompts and provide email
# Certificate will auto-renew
```

---

## 🛠️ Server Management

### Access Server
```powershell
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219
```

### PM2 Commands
```bash
# Check application status
pm2 status

# View logs (real-time)
pm2 logs bean-analytics

# View all logs
pm2 logs

# Restart application
pm2 restart bean-analytics

# Stop application
pm2 stop bean-analytics

# Start application
pm2 start bean-analytics

# Monitor resources
pm2 monit
```

### Nginx Commands
```bash
# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Test nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/beananalytics_error.log
sudo tail -f /var/log/nginx/beananalytics_access.log
```

### Database Management
```bash
# Navigate to database
cd /home/ec2-user/bean-analytics/server/database

# Backup database
cp database.db database_backup_$(date +%Y%m%d).db

# View database
sqlite3 database.db
```

---

## 🔄 Update Deployment

To deploy updates:

1. Make changes to your code
2. Commit changes (optional)
3. Run deployment script:
   ```powershell
   .\deploy.ps1
   ```

The script automatically:
- Builds new version
- Transfers files
- Restarts application
- Zero-downtime deployment with PM2

---

## 📊 Monitoring

### Application Health
- Health Check: `https://beananalytics.xyz/api/health`
- PM2 Monitor: `pm2 monit`

### Logs Location
- Application: `/home/ec2-user/bean-analytics/logs/`
- Nginx: `/var/log/nginx/`
- PM2: `~/.pm2/logs/`

### View Logs
```bash
# Application logs
pm2 logs bean-analytics --lines 100

# Error logs only
pm2 logs bean-analytics --err

# Nginx access logs
sudo tail -f /var/log/nginx/beananalytics_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/beananalytics_error.log
```

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs bean-analytics

# Check if port 5000 is available
sudo netstat -tulpn | grep 5000

# Restart application
pm2 restart bean-analytics
```

### Nginx Issues
```bash
# Test nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Check if nginx is listening
sudo netstat -tulpn | grep nginx
```

### Database Issues
```bash
# Check database permissions
ls -la /home/ec2-user/bean-analytics/server/database/

# Fix permissions
chmod 644 /home/ec2-user/bean-analytics/server/database/database.db
```

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process (if needed)
sudo kill -9 <PID>

# Restart application
pm2 restart bean-analytics
```

### DNS Not Resolving
```bash
# Check DNS
nslookup beananalytics.xyz

# Check if domain points to correct IP
dig beananalytics.xyz
```

---

## 🔐 Security Checklist

- ✅ Firewall configured (HTTP, HTTPS only)
- ✅ SSH key authentication
- ✅ Security headers in nginx
- ☐ SSL certificate installed
- ☐ Change JWT_SECRET in production
- ☐ Regular security updates
- ☐ Database backups scheduled
- ☐ Rate limiting configured

---

## 📝 Environment Variables

Edit production environment:
```bash
nano /home/ec2-user/bean-analytics/server/.env

# After changes, restart
pm2 restart bean-analytics
```

Required variables:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<your-secret-key>
DB_PATH=./database/database.db
```

---

## 🔄 Rollback

If deployment fails:

```bash
# SSH to server
ssh -i "C:\Users\nagar\Downloads\key-mern.pem" ec2-user@13.221.255.219

# Previous versions are in home directory
cd ~
ls -lt bean-analytics-*.tar.gz

# Extract previous version
tar -xzf bean-analytics-<timestamp>.tar.gz -C /home/ec2-user/bean-analytics/

# Restart
cd /home/ec2-user/bean-analytics
pm2 restart bean-analytics
```

---

## 📞 Support

For issues:
1. Check logs: `pm2 logs bean-analytics`
2. Check nginx: `sudo nginx -t`
3. Check health: `curl http://localhost:5000/api/health`
4. Review this guide's troubleshooting section

---

## 📈 Performance Tips

1. **Enable PM2 clustering:**
   Edit `ecosystem.config.js`:
   ```javascript
   instances: 'max'  // Use all CPU cores
   ```

2. **Database optimization:**
   ```bash
   # Create indexes, vacuum database
   sqlite3 database.db "VACUUM;"
   ```

3. **Monitor resources:**
   ```bash
   # Check server resources
   htop
   
   # Check disk space
   df -h
   
   # Check memory
   free -m
   ```

4. **Set up log rotation:**
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible at domain
- [ ] SSL certificate installed
- [ ] Health check endpoint working
- [ ] Database initialized
- [ ] PM2 auto-start configured
- [ ] Nginx auto-start configured
- [ ] Firewall rules active
- [ ] Logs accessible
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] DNS configured correctly
- [ ] www redirect working

---

**Last Updated:** February 15, 2026
**Version:** 1.0.0
