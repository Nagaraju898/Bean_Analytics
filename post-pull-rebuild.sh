#!/bin/bash
################################################################################
# Post-Git Pull Docker Auto-Rebuild Script
# Purpose: Automatically rebuild and redeploy Docker containers after git pull
# Usage: ./post-pull-rebuild.sh
# Install as git hook: cp post-pull-rebuild.sh .git/hooks/post-pull (chmod +x)
################################################################################

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${PROJECT_DIR}/docker-rebuild.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗ ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

################################################################################
# Main Script
################################################################################

log "=========================================="
log "Docker Auto-Rebuild Started"
log "=========================================="
log "Timestamp: $TIMESTAMP"
log "Project Directory: $PROJECT_DIR"

# Check if docker is running
if ! command -v docker &> /dev/null; then
    error "Docker is not installed"
    exit 1
fi

# Check git changes
cd "$PROJECT_DIR"

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD@{1} HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    warning "No git changes detected"
    exit 0
fi

log "Changed files detected:"
echo "$CHANGED_FILES" | sed 's/^/  - /' | tee -a "$LOG_FILE"

# Check what needs rebuilding
REBUILD_BACKEND=false
REBUILD_FRONTEND=false

if echo "$CHANGED_FILES" | grep -q "^server/"; then
    REBUILD_BACKEND=true
    log "Backend changes detected: Will rebuild"
fi

if echo "$CHANGED_FILES" | grep -q "^client/"; then
    REBUILD_FRONTEND=true
    log "Frontend changes detected: Will rebuild"
fi

if echo "$CHANGED_FILES" | grep -q "^docker-compose"; then
    log "Docker Compose changes: Will restart services"
fi

if echo "$CHANGED_FILES" | grep -q "^nginx.conf"; then
    log "Nginx config changes: Will reload nginx"
fi

# Rebuild backend if needed
if [ "$REBUILD_BACKEND" = true ]; then
    log "================================================"
    log "Building Backend Image..."
    log "================================================"
    cd "$PROJECT_DIR/server"
    
    if docker build -t project_3-backend:latest . 2>&1 | tee -a "$LOG_FILE"; then
        success "Backend image built successfully"
    else
        error "Backend build failed"
        exit 1
    fi
fi

# Rebuild frontend if needed
if [ "$REBUILD_FRONTEND" = true ]; then
    log "================================================"
    log "Building Frontend Image..."
    log "================================================"
    cd "$PROJECT_DIR/client"
    
    if docker build -t project_3-frontend:latest . 2>&1 | tee -a "$LOG_FILE"; then
        success "Frontend image built successfully"
    else
        error "Frontend build failed"
        exit 1
    fi
fi

# Restart services if rebuilds happened
if [ "$REBUILD_BACKEND" = true ] || [ "$REBUILD_FRONTEND" = true ]; then
    cd "$PROJECT_DIR"
    
    log "================================================"
    log "Restarting Docker Services..."
    log "================================================"
    
    if [ "$REBUILD_BACKEND" = true ]; then
        log "Restarting backend..."
        if sudo docker-compose restart backend 2>&1 | tee -a "$LOG_FILE"; then
            success "Backend restarted"
        else
            error "Backend restart failed"
        fi
    fi
    
    if [ "$REBUILD_FRONTEND" = true ]; then
        log "Restarting frontend..."
        if sudo docker-compose restart frontend 2>&1 | tee -a "$LOG_FILE"; then
            success "Frontend restarted"
        else
            error "Frontend restart failed"
        fi
    fi
fi

# Check container status
log "================================================"
log "Container Status:"
log "================================================"
sudo docker-compose ps | tee -a "$LOG_FILE"

# Verify health
log "================================================"
log "Health Check:"
log "================================================"

# Backend health check
if sudo docker-compose exec -T backend node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" 2>&1 | tee -a "$LOG_FILE"; then
    success "Backend is healthy"
else
    warning "Backend health check inconclusive"
fi

# Frontend health check
if sudo docker-compose exec -T frontend node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" 2>&1 | tee -a "$LOG_FILE"; then
    success "Frontend is healthy"
else
    warning "Frontend health check inconclusive"
fi

log "=========================================="
success "Docker Auto-Rebuild Completed"
log "=========================================="
log "Log saved to: $LOG_FILE"
log ""
