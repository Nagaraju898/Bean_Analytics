#!/bin/bash

# E-Commerce Analytics Platform - One-Command Deploy Script
# Usage: ./deploy.sh

echo "=========================================="
echo "Starting Deployment..."
echo "=========================================="

# Pull latest code
echo ""
echo "📥 Pulling latest code from Git..."
git pull
if [ $? -ne 0 ]; then
    echo "❌ Git pull failed!"
    exit 1
fi

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Server npm install failed!"
    exit 1
fi

# Install client dependencies
echo ""
echo "📦 Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Client npm install failed!"
    exit 1
fi

# Build React app
echo ""
echo "🔨 Building client (React)..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Restart backend with PM2
echo ""
echo "🚀 Restarting backend with PM2..."
cd ..
pm2 restart ecommerce-api
if [ $? -ne 0 ]; then
    echo "⚠️  PM2 restart warning (might need to start fresh)"
    pm2 start ecosystem.config.js
fi

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Hard refresh browser: Ctrl + Shift + R"
echo "2. Or clear cache in DevTools → Network → Disable Cache"
echo ""
