# 🔗 Post-Deployment: Next Steps

## Current Status
✅ **Docker containers running on EC2 (13.221.255.219)**  
✅ **All services healthy and responding**  
✅ **Backend API operational**  
✅ **Frontend React app loading**  

---

## IMMEDIATE ACTIONS REQUIRED

### 1️⃣ Configure AWS Security Group (5 minutes)

**Goal:** Allow public access to ports 80 (HTTP) and 443 (HTTPS)

**Steps:**
1. Log in to AWS Console
2. Go to **EC2 → Instances → [your instance]**
3. Click **Security** tab
4. Click on security group link
5. Click **Edit inbound rules**
6. Add rules:
   ```
   Type: HTTP          Protocol: TCP    Port Range: 80      Source: 0.0.0.0/0
   Type: HTTPS         Protocol: TCP    Port Range: 443     Source: 0.0.0.0/0
   Type: SSH (optional)Protocol: TCP    Port Range: 22      Source: [Your IP]
   ```
7. Click **Save rules**

✅ After this step: Public can access http://13.221.255.219

---

### 2️⃣ Configure DNS Records (5 minutes)

**Goal:** Point domain beananalytics.xyz to EC2 IP

**At Your Domain Registrar (GoDaddy, Namecheap, Route53, etc.):**

Add these A records:
```
Domain:           beananalytics.xyz
Type:             A
Value:            13.221.255.219
TTL:              3600 (or lower for faster updates)

Domain:           www.beananalytics.xyz
Type:             CNAME
Value:            beananalytics.xyz
TTL:              3600
```

**Verification:**
```bash
# Wait 5-15 minutes for DNS to propagate, then:
nslookup beananalytics.xyz
# Should show: 13.221.255.219

# Test accessibility:
curl http://beananalytics.xyz/health
# Should return: "healthy"
```

✅ After this step: Access http://beananalytics.xyz in browser

---

### 3️⃣ Setup SSL/HTTPS (10 minutes) - OPTIONAL BUT RECOMMENDED

**Goal:** Enable HTTPS with Let's Encrypt certificate

**Option A: Automated Setup (Recommended)**
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219
cd ~/project_3
sudo bash setup-ssl.sh
# Follow prompts, enter email when asked
```

**Option B: Manual Setup**
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219
sudo yum install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone \
  -d beananalytics.xyz \
  -d www.beananalytics.xyz \
  -m admin@beananalytics.xyz \
  --agree-tos \
  --non-interactive

# Update nginx.conf with cert paths:
# ssl_certificate /etc/letsencrypt/live/beananalytics.xyz/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/beananalytics.xyz/privkey.pem;

# Upload updated nginx.conf
# Restart nginx
cd ~/project_3
sudo docker-compose restart analytics-nginx
```

✅ After this step: Access https://beananalytics.xyz securely

---

## Testing After Configuration

### Test HTTP Access
```bash
# After security group + DNS configured:
curl -I http://beananalytics.xyz/
# Expected: HTTP/1.1 200 OK

curl http://beananalytics.xyz/health
# Expected: "healthy"

curl http://beananalytics.xyz/api/health
# Expected: {"status":"OK","message":"Server is running"}
```

### Test HTTPS Access (after SSL setup)
```bash
curl -I https://beananalytics.xyz/
# Expected: HTTP/1.1 200 OK with SSL certificate info

curl https://beananalytics.xyz/health
# Expected: "healthy"
```

### Test Browser Access
Open these in your browser:
- http://beananalytics.xyz → Should load React app
- https://beananalytics.xyz → Should load React app (after SSL setup)
- http://beananalytics.xyz/api/health → Should show `{"status":"OK","message":"Server is running"}`

---

## Monitoring & Maintenance

### Check Container Health
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose ps'
# All should show "Up (healthy)"
```

### View Real-Time Logs
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose logs -f analytics-nginx'
# Ctrl+C to stop following
```

### Restart Services (if needed)
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose restart'
```

### Update Application Code
```bash
# 1. Update code locally
# 2. Upload to EC2 and rebuild:
ssh -i "key-mern.pem" ec2-user@13.221.255.219
cd ~/project_3

# Rebuild specific service:
sudo docker build -t project_3-backend server/
# OR
sudo docker build -t project_3-frontend client/

# Restart containers:
sudo docker-compose down
sudo docker-compose up -d
```

---

## Troubleshooting

### Still can't access via domain?
1. Check DNS propagation: `nslookup beananalytics.xyz`
2. Check security group: AWS Console → Security Groups → Verify port 80/443 open
3. Check nginx logs: `ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose logs analytics-nginx'`

### Backend API not responding?
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose logs analytics-backend'
```

### Frontend not loading?
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose logs analytics-frontend'
```

### SSL certificate issues?
```bash
# Check certificate
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'sudo certbot certificates'

# Renew manually
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'sudo certbot renew'
```

---

## Performance Tips

1. **Monitor Container Resources:**
   ```bash
   ssh -i "key-mern.pem" ec2-user@13.221.255.219 'sudo docker stats'
   ```

2. **Increase Backend Memory (if needed):**
   Edit `/home/ec2-user/project_3/docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G  # Increase from 1G
   ```

3. **Enable Gzip Compression** (already configured in nginx.conf)

4. **Setup Auto-Renewal for SSL** (automatic via certbot)

---

## Timeline

- ✅ **Feb 17, 2024:** Docker deployment complete, all containers running
- ⏳ **Next:** Security group + DNS configuration (5-15 minutes)
- ⏳ **Optional:** SSL setup (10 minutes)
- 🎉 **Result:** Live production application

---

## Emergency Commands

### Stop all services
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose down'
```

### Force restart all services
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'cd ~/project_3 && sudo docker-compose down && sleep 5 && sudo docker-compose up -d'
```

### Clean up unused Docker resources
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'sudo docker system prune -a'
```

### View disk usage
```bash
ssh -i "key-mern.pem" ec2-user@13.221.255.219 'df -h && sudo docker system df'
```

---

## Summary

Your application is **up and running**. Complete the checklist below to make it publicly available:

- [ ] ✅ Docker containers deployed and healthy
- [ ] Configure AWS Security Group (ports 80/443)
- [ ] Configure DNS records (A and CNAME)
- [ ] (Optional) Setup SSL certificates
- [ ] Test http://beananalytics.xyz in browser
- [ ] Setup monitoring/alerts (optional)

---

📧 **Need Help?** Check the logs or review [EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md)

🚀 **You're ready to go live!**
