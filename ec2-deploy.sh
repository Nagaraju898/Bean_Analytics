#!/bin/bash
################################################################################
# EC2 Docker Deployment Script
# E-Commerce Analytics Platform
#
# Usage: ./ec2-deploy.sh [--ssl]
# Options:
#   --ssl    Setup SSL certificates with Let's Encrypt
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="beananalytics.xyz"
EMAIL="admin@beananalytics.xyz"
SSL_ENABLED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ssl)
            SSL_ENABLED=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║      EC2 Docker Deployment - BeanAnalytics Platform      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

################################################################################
# STEP 1: Stop Old Services
################################################################################
echo -e "${YELLOW}[1/10] Stopping old PM2 and Nginx services...${NC}"

if command -v pm2 &> /dev/null; then
    echo "   → Stopping PM2 processes..."
    pm2 delete all 2>/dev/null || true
    pm2 kill 2>/dev/null || true
    echo -e "   ${GREEN}✓ PM2 stopped${NC}"
else
    echo "   ⚠ PM2 not found (skipping)"
fi

if systemctl is-active --quiet nginx; then
    echo "   → Stopping old Nginx..."
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    echo -e "   ${GREEN}✓ Nginx stopped${NC}"
else
    echo "   ⚠ Nginx not running (skipping)"
fi

# Check if port 80 is free
if sudo netstat -tulpn | grep :80 > /dev/null; then
    echo -e "   ${RED}✗ Port 80 is still in use!${NC}"
    echo "   Run: sudo netstat -tulpn | grep :80"
    exit 1
fi

echo -e "   ${GREEN}✓ Port 80 is available${NC}\n"

################################################################################
# STEP 2: Install Docker
################################################################################
echo -e "${YELLOW}[2/10] Installing Docker...${NC}"

if command -v docker &> /dev/null; then
    echo "   ✓ Docker already installed: $(docker --version)"
else
    echo "   → Updating system packages..."
    sudo yum update -y > /dev/null
    
    echo "   → Installing Docker..."
    sudo yum install docker -y > /dev/null
    
    echo "   → Starting Docker service..."
    sudo systemctl start docker
    sudo systemctl enable docker
    
    echo "   → Adding user to docker group..."
    sudo usermod -aG docker $USER
    
    echo -e "   ${GREEN}✓ Docker installed: $(docker --version)${NC}"
    echo -e "   ${YELLOW}⚠ Please logout and login again to apply docker group membership${NC}"
fi

echo ""

################################################################################
# STEP 3: Install Docker Compose
################################################################################
echo -e "${YELLOW}[3/10] Installing Docker Compose...${NC}"

if command -v docker-compose &> /dev/null; then
    echo "   ✓ Docker Compose already installed: $(docker-compose --version)"
else
    echo "   → Downloading Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose 2>/dev/null
    
    echo "   → Making executable..."
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo -e "   ${GREEN}✓ Docker Compose installed: $(docker-compose --version)${NC}"
fi

echo ""

################################################################################
# STEP 4: Verify Project Structure
################################################################################
echo -e "${YELLOW}[4/10] Verifying project structure...${NC}"

REQUIRED_FILES=(
    "docker-compose.yml"
    ".env"
    "nginx.conf"
    "server/Dockerfile"
    "client/Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓ $file${NC}"
    else
        echo -e "   ${RED}✗ Missing: $file${NC}"
        exit 1
    fi
done

echo ""

################################################################################
# STEP 5: Create Required Directories
################################################################################
echo -e "${YELLOW}[5/10] Creating data directories...${NC}"

mkdir -p data/backend
mkdir -p data/nginx/logs
mkdir -p data/nginx/cache
mkdir -p nginx/ssl

echo -e "   ${GREEN}✓ Directories created${NC}\n"

################################################################################
# STEP 6: Update Production Configuration
################################################################################
echo -e "${YELLOW}[6/10] Updating production configuration...${NC}"

# Update .env for production
if [ -f ".env" ]; then
    echo "   → Updating .env file..."
    
    # Backup original
    cp .env .env.backup
    
    # Update values
    sed -i "s|NODE_ENV=.*|NODE_ENV=production|g" .env
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN|g" .env
    sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=https://$DOMAIN/api|g" .env
    
    echo -e "   ${GREEN}✓ .env updated for production${NC}"
else
    echo -e "   ${RED}✗ .env file not found${NC}"
    exit 1
fi

echo ""

################################################################################
# STEP 7: Build Docker Images
################################################################################
echo -e "${YELLOW}[7/10] Building Docker images...${NC}"
echo "   This may take 5-10 minutes..."

docker-compose build 2>&1 | while read line; do
    if [[ $line == *"Successfully built"* ]] || [[ $line == *"DONE"* ]]; then
        echo "   $line"
    fi
done

echo -e "   ${GREEN}✓ Docker images built${NC}\n"

################################################################################
# STEP 8: SSL Certificate Setup (Optional)
################################################################################
if [ "$SSL_ENABLED" = true ]; then
    echo -e "${YELLOW}[8/10] Setting up SSL certificates...${NC}"
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "   → Installing certbot..."
        sudo yum install certbot -y > /dev/null
    fi
    
    # Generate certificates
    echo "   → Generating SSL certificates for $DOMAIN..."
    sudo certbot certonly --standalone \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --email $EMAIL \
        --agree-tos \
        --non-interactive \
        --preferred-challenges http
    
    # Copy certificates
    echo "   → Copying certificates to project..."
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/key.pem
    sudo chown $USER:$USER nginx/ssl/*.pem
    chmod 644 nginx/ssl/cert.pem
    chmod 600 nginx/ssl/key.pem
    
    echo -e "   ${GREEN}✓ SSL certificates installed${NC}"
    
    # Setup auto-renewal
    echo "   → Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 0 * * 0 certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/*.pem $(pwd)/nginx/ssl/ && cd $(pwd) && docker-compose restart nginx") | crontab -
    
    echo -e "   ${GREEN}✓ Auto-renewal configured${NC}\n"
else
    echo -e "${YELLOW}[8/10] Skipping SSL setup (use --ssl flag to enable)${NC}\n"
fi

################################################################################
# STEP 9: Start Docker Containers
################################################################################
echo -e "${YELLOW}[9/10] Starting Docker containers...${NC}"

docker-compose up -d

echo "   → Waiting for containers to be healthy..."
sleep 10

# Check container status
if docker-compose ps | grep -q "healthy"; then
    echo -e "   ${GREEN}✓ Containers started and healthy${NC}\n"
else
    echo -e "   ${YELLOW}⚠ Containers started but health check pending...${NC}\n"
fi

################################################################################
# STEP 10: Verification
################################################################################
echo -e "${YELLOW}[10/10] Verifying deployment...${NC}"

# Check containers
NGINX_STATUS=$(docker inspect -f '{{.State.Health.Status}}' analytics-nginx 2>/dev/null || echo "unknown")
BACKEND_STATUS=$(docker inspect -f '{{.State.Health.Status}}' analytics-backend 2>/dev/null || echo "unknown")
FRONTEND_STATUS=$(docker inspect -f '{{.State.Health.Status}}' analytics-frontend 2>/dev/null || echo "unknown")

echo "   Container Status:"
echo "   → Nginx:    $NGINX_STATUS"
echo "   → Backend:  $BACKEND_STATUS"
echo "   → Frontend: $FRONTEND_STATUS"

# Test endpoints
echo -e "\n   Testing endpoints..."

if curl -s http://localhost/health > /dev/null; then
    echo -e "   ${GREEN}✓ Health endpoint responding${NC}"
else
    echo -e "   ${RED}✗ Health endpoint not responding${NC}"
fi

if curl -s http://localhost/api/health | grep -q "OK"; then
    echo -e "   ${GREEN}✓ Backend API responding${NC}"
else
    echo -e "   ${RED}✗ Backend API not responding${NC}"
fi

################################################################################
# Deployment Summary
################################################################################
echo -e "\n${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🎉 DEPLOYMENT COMPLETE! 🎉                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

echo -e "${GREEN}📊 Container Status:${NC}"
docker-compose ps

echo -e "\n${GREEN}🌐 Access URLs:${NC}"
echo "   Frontend:   http://$DOMAIN/"
echo "   Backend:    http://$DOMAIN/api/"
echo "   Health:     http://$DOMAIN/health"

if [ "$SSL_ENABLED" = true ]; then
    echo "   HTTPS:      https://$DOMAIN/"
fi

echo -e "\n${GREEN}📚 Useful Commands:${NC}"
echo "   View logs:        docker-compose logs -f"
echo "   Check status:     docker-compose ps"
echo "   Restart:          docker-compose restart"
echo "   Stop:             docker-compose down"
echo "   Rebuild:          docker-compose up -d --build"

echo -e "\n${GREEN}📁 File Locations:${NC}"
echo "   Database:         $(pwd)/data/backend/analytics.db"
echo "   Nginx Logs:       $(pwd)/data/nginx/logs/"
echo "   SSL Certs:        $(pwd)/nginx/ssl/"

echo -e "\n${YELLOW}⚠ Important Notes:${NC}"
echo "   1. Ensure EC2 Security Group allows ports 80 and 443"
echo "   2. DNS records should point to this EC2 instance"
echo "   3. Monitor logs: docker-compose logs -f"
echo "   4. Backup database regularly"

if [ "$SSL_ENABLED" = false ]; then
    echo -e "\n${CYAN}💡 To enable SSL, run:${NC}"
    echo "   ./ec2-deploy.sh --ssl"
fi

echo -e "\n${GREEN}✅ Deployment successful!${NC}\n"
