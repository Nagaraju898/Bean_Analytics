#!/bin/bash
# Deploy to EC2 - Simple manual approach

echo "Starting EC2 deployment..."

# Configuration
EC2_HOST="13.221.255.219"
EC2_USER="ec2-user"
SSH_KEY="C:\Users\nagar\Downloads\key-mern.pem"

# Connect and run deployment
ssh -i "$SSH_KEY" $EC2_USER@$EC2_HOST << 'EOF'

# Step 1: Stop old services
echo "[1] Stopping old services..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Step 2: Install Docker
echo "[2] Installing Docker..."
sudo yum update -y > /dev/null
sudo yum install docker -y > /dev/null
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Step 3: Install Docker Compose
echo "[3] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose 2>/dev/null
sudo chmod +x /usr/local/bin/docker-compose

# Step 4: Create project directory
echo "[4] Creating project directory..."
mkdir -p ~/project_3
cd ~/project_3

# Verify Docker
echo ""
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker-compose --version

EOF

echo "Deployment script sent to EC2!"
