# Bean Analytics - Deployment Script for EC2
# Run this script from Windows PowerShell

$EC2_IP = "13.221.255.219"
$EC2_USER = "ec2-user"
$PEM_KEY = "C:\Users\nagar\Downloads\key-mern.pem"
$DOMAIN = "beananalytics.xyz"
$PROJECT_DIR = "c:\Users\nagar\OneDrive\Desktop\project_3\E-Commerce_Analytics_Platform-main\project_3"
$REMOTE_DIR = "/home/ec2-user/bean-analytics"

Write-Host "Starting deployment to EC2..." -ForegroundColor Cyan
Write-Host "EC2 IP: $EC2_IP" -ForegroundColor Yellow
Write-Host "Domain: $DOMAIN" -ForegroundColor Yellow
Write-Host ""

# Step 1: Build React application (skip if already built)
Write-Host "Step 1: Checking React build..." -ForegroundColor Green
Set-Location $PROJECT_DIR
if (Test-Path "client\build") {
    Write-Host "Build folder exists, skipping build..." -ForegroundColor Yellow
} else {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed! Please fix errors and try again." -ForegroundColor Red
        exit 1
    }
}
Write-Host "Build ready!" -ForegroundColor Green
Write-Host ""

# Step 2: Create deployment package
Write-Host "Step 2: Creating deployment package..." -ForegroundColor Green
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$deployPackage = "bean-analytics.tar.gz"
$tempDeployDir = "deploy-temp"

# Clean up old deployment artifacts
if (Test-Path $deployPackage) { Remove-Item $deployPackage -Force }
if (Test-Path $tempDeployDir) { Remove-Item $tempDeployDir -Recurse -Force }

# Create temporary deployment directory
New-Item -ItemType Directory -Path $tempDeployDir | Out-Null
New-Item -ItemType Directory -Path "$tempDeployDir\server" | Out-Null
New-Item -ItemType Directory -Path "$tempDeployDir\client" | Out-Null

# Copy necessary files
Write-Host "Copying files..." -ForegroundColor Yellow
Copy-Item "package.json" -Destination $tempDeployDir
Copy-Item "ecosystem.config.js" -Destination $tempDeployDir
Copy-Item "nginx.conf" -Destination $tempDeployDir

# Copy server files (excluding node_modules)
Copy-Item "server\*" -Destination "$tempDeployDir\server" -Recurse -Exclude node_modules,*.log

# Copy client build
if (Test-Path "client\build") {
    Copy-Item "client\build" -Destination "$tempDeployDir\client" -Recurse
}

# Create tarball
Write-Host "Creating archive..." -ForegroundColor Yellow
Push-Location
Set-Location $tempDeployDir
tar -czf "..\$deployPackage" *
Pop-Location

# Clean up temp directory
Remove-Item $tempDeployDir -Recurse -Force

if (-not (Test-Path $deployPackage)) {
    Write-Host "Failed to create deployment package!" -ForegroundColor Red
    exit 1
}

$size = (Get-Item $deployPackage).Length / 1MB
Write-Host "Deployment package created: $deployPackage ($($size.ToString('F2')) MB)" -ForegroundColor Green
Write-Host ""

# Step 3: Transfer files to EC2
Write-Host "Step 3: Transferring files to EC2..." -ForegroundColor Green
scp -i $PEM_KEY $deployPackage "${EC2_USER}@${EC2_IP}:/home/ec2-user/"
scp -i $PEM_KEY nginx.conf "${EC2_USER}@${EC2_IP}:/home/ec2-user/"
scp -i $PEM_KEY server/.env.production "${EC2_USER}@${EC2_IP}:/home/ec2-user/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "File transfer failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Files transferred successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Setup and deploy on EC2
Write-Host "Step 4: Setting up EC2 server..." -ForegroundColor Green
Write-Host "Connecting to EC2..." -ForegroundColor Yellow

# Execute setup commands directly via SSH
$setupCommands = @"
echo 'Setting up Bean Analytics on EC2...' && \
echo '' && \
echo 'Updating system packages...' && \
sudo yum update -y && \
echo 'Checking Node.js installation...' && \
if ! command -v node; then \
    echo 'Installing Node.js...' && \
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && \
    sudo yum install -y nodejs; \
fi && \
echo 'Checking nginx installation...' && \
if ! command -v nginx; then \
    echo 'Installing nginx...' && \
    sudo amazon-linux-extras install nginx1 -y; \
fi && \
echo 'Checking PM2 installation...' && \
if ! command -v pm2; then \
    echo 'Installing PM2...' && \
    sudo npm install -g pm2; \
fi && \
echo 'Creating application directory...' && \
sudo mkdir -p /home/ec2-user/bean-analytics && \
sudo chown -R ec2-user:ec2-user /home/ec2-user/bean-analytics && \
echo 'Extracting deployment package...' && \
cd /home/ec2-user && \
tar -xzf bean-analytics.tar.gz -C /home/ec2-user/bean-analytics && \
cd /home/ec2-user/bean-analytics && \
cp /home/ec2-user/.env.production ./server/.env && \
echo 'Installing dependencies...' && \
npm install --production && \
cd server && npm install --production && cd .. && \
mkdir -p logs && \
mkdir -p server/database && \
pm2 stop bean-analytics 2>/dev/null || true && \
pm2 delete bean-analytics 2>/dev/null || true && \
echo 'Starting application with PM2...' && \
pm2 start ecosystem.config.js && \
pm2 save && \
pm2 startup systemd -u ec2-user --hp /home/ec2-user && \
echo 'Configuring nginx...' && \
sudo cp /home/ec2-user/nginx.conf /etc/nginx/conf.d/beananalytics.conf && \
sudo nginx -t && sudo systemctl restart nginx && \
sudo systemctl enable nginx && \
echo 'Configuring firewall...' && \
sudo yum install -y firewalld && \
sudo systemctl start firewalld && \
sudo systemctl enable firewalld && \
sudo firewall-cmd --permanent --add-service=http && \
sudo firewall-cmd --permanent --add-service=https && \
sudo firewall-cmd --reload && \
echo '' && \
echo 'Deployment completed successfully!' && \
echo '' && \
echo 'Application Status:' && \
pm2 status && \
echo '' && \
echo 'Your application is now running!' && \
echo 'HTTP: http://beananalytics.xyz' && \
echo 'Server: http://13.221.255.219'
"@

Write-Host "Executing setup commands on EC2..." -ForegroundColor Yellow
ssh -i $PEM_KEY "${EC2_USER}@${EC2_IP}" $setupCommands

# Cleanup local files
if (Test-Path $deployPackage) { Remove-Item $deployPackage -Force }

Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application:" -ForegroundColor Cyan
Write-Host "   HTTP: http://$DOMAIN" -ForegroundColor Yellow
Write-Host "   Direct: http://$EC2_IP" -ForegroundColor Yellow
Write-Host ""
Write-Host "To enable HTTPS, SSH into your server and run:" -ForegroundColor Cyan
Write-Host "   ssh -i $PEM_KEY $EC2_USER@$EC2_IP" -ForegroundColor Yellow
Write-Host "   sudo yum install -y certbot python3-certbot-nginx" -ForegroundColor Yellow
Write-Host "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN" -ForegroundColor Yellow
Write-Host ""
