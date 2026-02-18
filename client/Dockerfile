################################################################################
# Frontend Dockerfile - Production-Ready React Application
#
# Multi-stage build process:
# 1. Build stage: Compile React app with Node.js (larger)
# 2. Production stage: Lightweight Node.js with 'serve' runner (smaller)
#
# Features:
#   - Alpine Linux base (minimal size)
#   - Multi-stage build optimization (final image ~300MB)
#   - Non-root user execution (security)
#   - Health checks for container orchestration
#   - Optimized for production deployment
#   - React code splitting and optimization
#   - Layer caching for faster rebuilds
################################################################################

# ============================================================================
# Stage 1: Build - Compile React Application
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
# Use npm ci for deterministic, reproducible builds
RUN npm ci

# Copy source code
COPY . .

# Build React application for production
# Creates optimized, minified, code-split build in ./build directory
RUN npm run build

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM node:18-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Install 'serve' - lightweight HTTP server for serving static files
RUN npm install -g serve@latest && \
    npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built React application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/build ./build

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check - verifies container is responsive
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Serve React application
# -s: serve from 'build' directory
# -l: listen on port 3000
CMD ["serve", "-s", "build", "-l", "3000"]
