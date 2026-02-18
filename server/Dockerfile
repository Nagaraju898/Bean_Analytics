################################################################################
# Backend Dockerfile - Production-Ready Node.js/Express Server
#
# Multi-stage build process:
# 1. Builder stage: Install dependencies and compile (larger)
# 2. Production stage: Only runtime dependencies (smaller, faster, more secure)
#
# Features:
#   - Alpine Linux base (minimal image size: ~160MB)
#   - Non-root user execution (security)
#   - Health checks for container orchestration
#   - Production-grade Node.js configuration
#   - Layer caching optimization
#   - Security: No dev dependencies, minimal attack surface
################################################################################

# ============================================================================
# Stage 1: Builder - Install dependencies
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files (required for npm install)
COPY package.json package-lock.json* ./

# Install dependencies
# Using npm ci for reproducible installations (better than npm install)
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM node:18-alpine

WORKDIR /app

# Set environment variables for Node.js runtime
ENV NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=512

# Create non-root user for security (prevents container escape vulnerabilities)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules from builder stage (production only, no dev dependencies)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=nodejs:nodejs . .

# Create data directory for SQLite database persistence
RUN mkdir -p /app/data && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/data /app/uploads && \
    chmod 755 /app/data /app/uploads

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check - allows Docker/orchestrators to monitor container health
# Checks if API health endpoint returns 200 status code
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
