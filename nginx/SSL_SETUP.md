# SSL/TLS Certificate Setup for Nginx

Complete guide to setting up HTTPS with Let's Encrypt or self-signed certificates.

## Quick Start (Let's Encrypt)

```bash
# 1. Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 2. Request certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com -m admin@your-domain.com --agree-tos

# 3. Copy to nginx directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# 4. Fix permissions
sudo chown $(whoami):$(whoami) nginx/ssl/*
chmod 644 nginx/ssl/cert.pem
chmod 600 nginx/ssl/key.pem

# 5. Start containers
docker-compose build
docker-compose up -d
```

## Let's Encrypt Setup (Recommended)

### Prerequisites

- Domain name pointing to server
- Port 80 open to internet (required for ACME challenge)
- Server with sudo access

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-dns-route53  # or nginx or cloudflare variant

# Amazon Linux 2
sudo yum install certbot python3-certbot-nginx
```

### Step 2: Generate Certificate

```bash
# Interactive mode (recommended)
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  -m admin@your-domain.com \
  --agree-tos

# Non-interactive mode
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com \
  -m admin@your-domain.com \
  --agree-tos \
  -n
```

**Output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/your-domain.com/
Key is saved at:        /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### Step 3: Copy to Docker Directory

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificate and key
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Fix permissions
sudo chown $(whoami):$(whoami) nginx/ssl/*
chmod 644 nginx/ssl/cert.pem   # Readable by all
chmod 600 nginx/ssl/key.pem    # Readable by owner only (private key)

# Verify
ls -la nginx/ssl/
```

### Step 4: Configure Auto-Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test renewal (dry run - no changes)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl list-timers snap.certbot.renew

# Or set up manual cron job
(crontab -l 2>/dev/null; echo "0 12 * * * certbot renew --quiet && docker-compose restart nginx") | crontab -

# Verify cron
crontab -l | grep certbot
```

### Step 5: Update Nginx Config

Verify `nginx/nginx.conf` has correct paths:

```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### Step 6: Start Containers

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# Verify HTTPS
curl -I https://your-domain.com
```

## Self-Signed Certificate Setup (Testing Only)

⚠️ **NOT FOR PRODUCTION** - Browsers will show security warnings

### Generate Self-Signed Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate (valid 365 days)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Verify
openssl x509 -in nginx/ssl/cert.pem -text -noout | head -20
```

**Output:**
```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 1234567890 (0x499602d2)
    Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = localhost
        Subject: CN = localhost
```

### Docker Usage

```bash
# Containers will use the self-signed certificate
docker-compose up -d

# Test with curl (ignore certificate warning)
curl -k https://localhost/api/health
```

## Certificate Monitoring

### Check Expiration

```bash
# View certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Show only expiration date
openssl x509 -in nginx/ssl/cert.pem -noout -enddate
# Output: notAfter=Feb 15 12:00:00 2027 GMT

# Check from command line
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Renewal Reminders

```bash
# Check if certificate needs renewal (Let's Encrypt)
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew --force-renewal

# Copy renewed certificate to Docker
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $(whoami):$(whoami) nginx/ssl/*

# Restart nginx container
docker-compose restart nginx
```

## Troubleshooting

### Certificate not found

**Error:** `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution:**
```bash
# Check if files exist
ls -la nginx/ssl/

# Verify ownership and permissions
stat nginx/ssl/cert.pem
stat nginx/ssl/key.pem

# If missing, regenerate or copy
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
```

### Certbot port 80 conflict

**Error:** `Address already in use`

**Solution:**
```bash
# Stop Docker containers
docker-compose down

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy and start containers
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
docker-compose up -d
```

### Certificate expired

**Error:** `SSL: CERTIFICATE_VERIFY_FAILED` (after 90 days)

**Solution:**
```bash
# Check expiration
openssl x509 -in nginx/ssl/cert.pem -noout -enddate

# If expired, renew
sudo certbot renew

# Copy new certificate
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx

# Verify
curl -I https://your-domain.com
```

### Mixed content warning

**Issue:** Browser shows "Not Secure" despite valid HTTPS

**Cause:** Page loads HTTP resources from HTTPS page

**Solution:** Update React code to use HTTPS or relative paths:
```javascript
// ❌ Wrong
const API_URL = 'http://api.example.com';

// ✅ Correct
const API_URL = '/api';  // Relative path (uses same protocol)
```

### Nginx error log

**Check error details:**
```bash
# View nginx error log
docker-compose logs nginx | grep error

# Or inside container
docker-compose exec nginx cat /var/log/nginx/error.log

# Real-time nginx access
docker-compose exec nginx tail -f /var/log/nginx/access.log
```

## Security Best Practices

### 1. Use Strong Certificates

- Always use Let's Encrypt (free and automatic)
- Minimum 2048-bit RSA key (preferably 4096-bit)
- Support TLS 1.2 and 1.3 only

### 2. Enable HSTS (HTTP Strict Transport Security)

Configured in `nginx/nginx.conf`:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Benefits:**
- Forces HTTPS for 1 year
- Prevents downgrade attacks
- Preload list submission

### 3. Certificate Pinning (Optional)

Add to nginx for extra security:
```nginx
add_header Public-Key-Pins 'pin-sha256="..."; max-age=2592000' always;
```

### 4. Regular Renewal Checks

Add to crontab:
```bash
# Daily check for certificate renewal
0 3 * * * certbot renew --quiet && docker-compose restart nginx >> /var/log/cert-renewal.log 2>&1
```

### 5. Monitor Certificate Expiration

```bash
# Create monitoring script
cat > /usr/local/bin/check-cert.sh << 'EOF'
#!/bin/bash
CERT_FILE="/opt/analytics/nginx/ssl/cert.pem"
DAYS_LEFT=$(( ($(openssl x509 -in $CERT_FILE -noout -dates | grep notAfter | cut -d= -f2- | date -f - +%s) - $(date +%s)) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
  echo "WARNING: Certificate expires in $DAYS_LEFT days"
  # Send alert email or Slack notification
fi
EOF

chmod +x /usr/local/bin/check-cert.sh

# Add to crontab
0 0 * * * /usr/local/bin/check-cert.sh
```

## File Structure

```
project_3/
├── nginx/
│   ├── nginx.conf          # Nginx configuration
│   └── ssl/
│       ├── cert.pem        # SSL certificate (fullchain from Let's Encrypt)
│       └── key.pem         # SSL private key
├── docker-compose.yml
└── .env
```

## Let's Encrypt References

- **Official Site:** https://letsencrypt.org
- **Certbot Docs:** https://certbot.eff.org
- **HTTP Challenge:** https://letsencrypt.org/how-it-works/
- **Auto Renewal:** https://certbot.eff.org/docs/using.html#automatic-renewals

## Certificate Verification

```bash
# Detailed certificate info
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate validity dates
openssl x509 -in nginx/ssl/cert.pem -noout -dates
# Output:
# notBefore=Feb 15 12:00:00 2026 GMT
# notAfter=May 16 12:00:00 2027 GMT

# Verify key matches certificate
openssl x509 -noout -modulus -in nginx/ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in nginx/ssl/key.pem | openssl md5
# Should output same MD5

# Test HTTPS from command line
openssl s_client -connect your-domain.com:443

# Check certificate chain
openssl s_client -connect your-domain.com:443 -showcerts
```

Your SSL/TLS setup is complete! 🔒
