# =============================================================================
# Stage 1: Builder - Build ứng dụng NestJS
# =============================================================================
FROM node:20-alpine AS builder

# Cài đặt các dependencies cần thiết cho build
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# =============================================================================
# Stage 2: Production - Image cuối cùng tối ưu
# =============================================================================
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

# Set working directory
WORKDIR /app

# Install Node.js 20
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application từ builder stage
COPY --from=builder /app/dist ./dist

# Create screenshots directory
RUN mkdir -p /app/screenshots && \
    chmod 777 /app/screenshots

# Environment variables
ENV NODE_ENV=production \
    PORT=3001 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run application
CMD ["node", "dist/main"]
