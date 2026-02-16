# Build stage for React app
FROM node:18-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files for root and server
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm install --production
RUN cd server && npm install --production

# Copy server code
COPY server/ ./server/

# Copy built React app from build stage
COPY --from=client-build /app/client/build ./client/build

# Create database directory
RUN mkdir -p /app/server/database

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the server
WORKDIR /app/server
CMD ["node", "index.js"]
