################################################################################
# Docker Auto-Rebuild on Git Pull (PowerShell Version)
# Purpose: Automatically rebuild and redeploy Docker containers after git pull
# Usage: .\post-pull-rebuild.ps1
# Setup: Add to .git/hooks/post-pull (create with no extension)
################################################################################

param(
    [string]$ProjectDir = (Get-Location).Path,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"
$LogFile = Join-Path $ProjectDir "docker-rebuild.log"
$Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

################################################################################
# Functions
################################################################################

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $Color = switch($Level) {
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "INFO" { "Cyan" }
        default { "White" }
    }
    
    $Prefix = switch($Level) {
        "ERROR" { "✗" }
        "SUCCESS" { "✓" }
        "WARNING" { "⚠" }
        "INFO" { "→" }
        default { "•" }
    }
    
    $Output = "[$(Get-Date -Format 'HH:mm:ss')] $Prefix $Message"
    Write-Host $Output -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $Output
}

function Check-Prerequisites {
    Write-Log "Checking prerequisites..." "INFO"
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Log "Docker is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Log "Docker Compose is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    # Check Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Log "Git is not installed or not in PATH" "ERROR"
        exit 1
    }
    
    Write-Log "All prerequisites met" "SUCCESS"
}

function Get-GitChanges {
    Push-Location $ProjectDir
    try {
        $Changes = git diff --name-only HEAD@{1} HEAD 2>$null
        $Changes = $Changes | Where-Object { $_ -ne "" }
        return $Changes
    }
    catch {
        Write-Log "Could not determine git changes: $_" "WARNING"
        return @()
    }
    finally {
        Pop-Location
    }
}

function Build-BackendImage {
    Write-Log "========================================" "INFO"
    Write-Log "Building Backend Image..." "INFO"
    Write-Log "========================================" "INFO"
    
    Push-Location "$ProjectDir\server"
    try {
        $Output = docker build -t project_3-backend:latest . 2>&1
        Write-Host $Output
        Add-Content -Path $LogFile -Value $Output
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Backend image built successfully" "SUCCESS"
            return $true
        }
        else {
            Write-Log "Backend build failed (exit code: $LASTEXITCODE)" "ERROR"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Build-FrontendImage {
    Write-Log "========================================" "INFO"
    Write-Log "Building Frontend Image..." "INFO"
    Write-Log "========================================" "INFO"
    
    Push-Location "$ProjectDir\client"
    try {
        $Output = docker build -t project_3-frontend:latest . 2>&1
        Write-Host $Output
        Add-Content -Path $LogFile -Value $Output
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Frontend image built successfully" "SUCCESS"
            return $true
        }
        else {
            Write-Log "Frontend build failed (exit code: $LASTEXITCODE)" "ERROR"
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

function Restart-Services {
    param(
        [bool]$RestartBackend,
        [bool]$RestartFrontend
    )
    
    Write-Log "========================================" "INFO"
    Write-Log "Restarting Docker Services..." "INFO"
    Write-Log "========================================" "INFO"
    
    Push-Location $ProjectDir
    try {
        if ($RestartBackend) {
            Write-Log "Restarting backend..." "INFO"
            $Output = docker-compose restart backend 2>&1
            Write-Host $Output
            Add-Content -Path $LogFile -Value $Output
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Backend restarted" "SUCCESS"
            }
            else {
                Write-Log "Backend restart failed" "ERROR"
            }
        }
        
        if ($RestartFrontend) {
            Write-Log "Restarting frontend..." "INFO"
            $Output = docker-compose restart frontend 2>&1
            Write-Host $Output
            Add-Content -Path $LogFile -Value $Output
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Frontend restarted" "SUCCESS"
            }
            else {
                Write-Log "Frontend restart failed" "ERROR"
            }
        }
    }
    finally {
        Pop-Location
    }
}

function Show-ContainerStatus {
    Write-Log "========================================" "INFO"
    Write-Log "Container Status:" "INFO"
    Write-Log "========================================" "INFO"
    
    Push-Location $ProjectDir
    try {
        $Output = docker-compose ps 2>&1
        Write-Host $Output
        Add-Content -Path $LogFile -Value $Output
    }
    finally {
        Pop-Location
    }
}

################################################################################
# Main Script
################################################################################

Write-Log "==========================================" "INFO"
Write-Log "Docker Auto-Rebuild Started" "INFO"
Write-Log "==========================================" "INFO"
Write-Log "Timestamp: $Timestamp" "INFO"
Write-Log "Project Directory: $ProjectDir" "INFO"
Write-Log "" "INFO"

# Check prerequisites
Check-Prerequisites

# Get git changes
Write-Log "Checking for git changes..." "INFO"
$Changes = Get-GitChanges

if ($Changes.Count -eq 0 -and -not $Force) {
    Write-Log "No git changes detected" "WARNING"
    exit 0
}

if ($Force) {
    Write-Log "Force flag set - proceeding with rebuild" "WARNING"
}
else {
    Write-Log "Changed files detected:" "INFO"
    $Changes | ForEach-Object { Write-Log "  • $_" "INFO" }
}

Write-Log "" "INFO"

# Determine what needs rebuilding
$RebuildBackend = $false
$RebuildFrontend = $false

if ($Changes | Where-Object { $_ -like "server/*" }) {
    $RebuildBackend = $true
    Write-Log "Backend changes detected: Will rebuild" "INFO"
}

if ($Changes | Where-Object { $_ -like "client/*" }) {
    $RebuildFrontend = $true
    Write-Log "Frontend changes detected: Will rebuild" "INFO"
}

# Build images
if ($RebuildBackend) {
    if (-not (Build-BackendImage)) {
        exit 1
    }
}

if ($RebuildFrontend) {
    if (-not (Build-FrontendImage)) {
        exit 1
    }
}

# Restart services if needed
if ($RebuildBackend -or $RebuildFrontend) {
    Restart-Services -RestartBackend $RebuildBackend -RestartFrontend $RebuildFrontend
}

# Show status
Write-Log "" "INFO"
Show-ContainerStatus

Write-Log "" "INFO"
Write-Log "==========================================" "INFO"
Write-Log "Docker Auto-Rebuild Completed Successfully" "SUCCESS"
Write-Log "==========================================" "INFO"
Write-Log "Log saved to: $LogFile" "INFO"
Write-Log "" "INFO"
