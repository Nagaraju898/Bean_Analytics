# Quick SSL Setup Script
# Run this after SSH-ing into your EC2 server

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d beananalytics.xyz -d www.beananalytics.xyz --non-interactive --agree-tos --email your-email@example.com

# Auto-renewal is automatically configured
sudo certbot renew --dry-run

echo ""
echo "SSL certificate installed successfully!"
echo "Your site is now accessible at:"
echo "https://beananalytics.xyz"
echo "https://www.beananalytics.xyz"
echo ""
echo "Certificate will auto-renew before expiration."
