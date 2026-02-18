# EC2 Deployment Script (Windows PowerShell)
# E-Commerce Analytics Platform - Upload and Deploy

################################################################################
# Configuration
################################################################################
$EC2_HOST = "13.221.255.219"
$EC2_USER = "ec2-user"
$SSH_KEY = "C:\Users\nagar\Downloads\key-mern.pem"
$PROJECT_DIR = "C:\Users\nagar\OneDrive\Desktop\project_3\E-Commerce_Analytics_Platform-main\project_3"
$REMOTE_DIR = "/home/ec2-user/project_3"

################################################################################
# Colors
################################################################################
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

################################################################################
# Banner
################################################################################
Write-Host "`n" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "      EC2 Docker Deployment - Upload Project to EC2             " -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "`n"

################################################################################
# Step 1: Validate Prerequisites
################################################################################
Write-Host "[1/6] Validating prerequisites..." -ForegroundColor Yellow

# Check SSH key exists
if (-Not (Test-Path $SSH_KEY)) {
    Write-Host "   [ERROR] SSH Key not found: $SSH_KEY" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] SSH Key found" -ForegroundColor Green

# Check project directory
if (-Not (Test-Path $PROJECT_DIR)) {
    Write-Host "   [ERROR] Project directory not found: $PROJECT_DIR" -ForegroundColor Red
    exit 1
}
Write-Host "   [OK] Project directory found" -ForegroundColor Green

# Check required files
$requiredFiles = @(
    "docker-compose.yml",
    ".env",
    "nginx.conf",
    "server\Dockerfile",
    "client\Dockerfile"
)

foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $PROJECT_DIR $file
    if (Test-Path $fullPath) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] Missing: $file" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

################################################################################
# Step 2: Create Deployment Package
################################################################################
Write-Host "[2/6] Creating deployment package..." -ForegroundColor Yellow

# Change to project directory
Set-Location $PROJECT_DIR

# Create temporary directory for deployment files
$tempDir = Join-Path $env:TEMP "ec2-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "   → Copying files to temporary directory..." -ForegroundColor Gray

# Copy files excluding unnecessary items
$excludePatterns = @(
    "node_modules",
    ".git",
    "build",
    "*.zip",
    "*.tar.gz",
    "data",
    ".env.local",
    ".DS_Store"
)

Get-ChildItem -Path $PROJECT_DIR -Recurse | ForEach-Object {
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($_.FullName -like "*\$pattern\*" -or $_.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude -and -not $_.PSIsContainer) {
        $relativePath = $_.FullName.Substring($PROJECT_DIR.Length + 1)
        $destPath = Join-Path $tempDir $relativePath
        $destDir = Split-Path $destPath -Parent
        
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        Copy-Item $_.FullName -Destination $destPath -Force
    }
}

# Create archive (use zip for simplicity)
$archivePath = Join-Path $env:TEMP "project_3.zip"
Write-Host "   Creating archive..." -ForegroundColor Gray
Compress-Archive -Path "$tempDir\*" -DestinationPath $archivePath -Force

Write-Host "   [OK] Package created: $archivePath" -ForegroundColor Green
Write-Host ""

################################################################################
# Step 3: Test EC2 Connection
################################################################################
Write-Host "[3/6] Testing EC2 connection..." -ForegroundColor Yellow

try {
    $testResult = ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${EC2_USER}@${EC2_HOST} "echo 'Connection successful'" 2>&1
    if ($testResult -match "Connection successful") {
        Write-Host "   [OK] EC2 connection successful" -ForegroundColor Green
    } else {
        Write-Host "   [ERROR] EC2 connection failed" -ForegroundColor Red
        Write-Host "   Error: $testResult" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   [ERROR] EC2 connection failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 4: Upload Project to EC2
################################################################################
Write-Host "[4/6] Uploading project to EC2..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

# Upload archive
try {
    scp -i $SSH_KEY -o StrictHostKeyChecking=no $archivePath ${EC2_USER}@${EC2_HOST}:~/ 2>&1 | Out-Null
    Write-Host "   [OK] Project uploaded" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Upload failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 5: Extract and Setup on EC2
################################################################################
Write-Host "[5/6] Setting up project on EC2..." -ForegroundColor Yellow

$archiveFilename = Split-Path $archivePath -Leaf

$setupCommands = @"
# Remove old project directory
rm -rf $REMOTE_DIR

# Create project directory
mkdir -p $REMOTE_DIR

# Extract archive
unzip -q ~/$archiveFilename -d $REMOTE_DIR

# Remove archive
rm ~/$archiveFilename

# Set permissions
chmod +x $REMOTE_DIR/ec2-deploy.sh

# Verify extraction
ls -la $REMOTE_DIR

echo "Project setup complete!"
"@

try {
    $result = ssh -i $SSH_KEY ${EC2_USER}@${EC2_HOST} $setupCommands
    Write-Host "   [OK] Project extracted on EC2" -ForegroundColor Green
} catch {
    Write-Host "   [ERROR] Setup failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

################################################################################
# Step 6: Deploy Docker Containers
################################################################################
Write-Host "[6/6] Starting Docker deployment on EC2..." -ForegroundColor Yellow

$deployCommands = @"
cd $REMOTE_DIR

# Make deployment script executable
chmod +x ec2-deploy.sh

# Run deployment script
./ec2-deploy.sh

# Show final status
docker-compose ps
"@

Write-Host "   → Running deployment script..." -ForegroundColor Gray
Write-Host "   (This will take several minutes for first-time setup)" -ForegroundColor Gray
Write-Host ""

ssh -i $SSH_KEY -t ${EC2_USER}@${EC2_HOST} $deployCommands

################################################################################
# Cleanup
################################################################################
Write-Host "`nCleaning up temporary files..." -ForegroundColor Gray
Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

################################################################################
# Success Summary
################################################################################
Write-Host "`n" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "             DEPLOYMENT INITIATED!                               " -ForegroundColor Cyan
Write-Host "                                                                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "`n"

Write-Host "📊 Next Steps:" -ForegroundColor Green
Write-Host "   1. Wait for Docker containers to start (check logs above)" -ForegroundColor White
Write-Host "   2. Verify EC2 Security Group allows ports 80 and 443" -ForegroundColor White
Write-Host "   3. Ensure DNS points to: $EC2_HOST" -ForegroundColor White
Write-Host "   4. Test endpoint: http://beananalytics.xyz" -ForegroundColor White

Write-Host "`n🔧 Useful Commands:" -ForegroundColor Green
Write-Host "   Connect to EC2:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$SSH_KEY`" $EC2_USER@$EC2_HOST" -ForegroundColor White

Write-Host "`n   View logs:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$SSH_KEY`" $EC2_USER@$EC2_HOST 'cd $REMOTE_DIR && docker-compose logs -f'" -ForegroundColor White

Write-Host "`n   Check status:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$SSH_KEY`" $EC2_USER@$EC2_HOST 'cd $REMOTE_DIR && docker-compose ps'" -ForegroundColor White

Write-Host "`n   Restart services:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$SSH_KEY`" $EC2_USER@$EC2_HOST 'cd $REMOTE_DIR && docker-compose restart'" -ForegroundColor White

Write-Host "`n[OK] Script completed successfully!`n" -ForegroundColor Green
