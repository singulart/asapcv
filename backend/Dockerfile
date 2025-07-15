# Multi-stage build for Node.js backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy shared package first
COPY shared/ ./shared/

# Install and build shared package
WORKDIR /app/shared
RUN npm install && npm cache clean --force
RUN npm run build

# Copy backend files
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/src/ ./src/
COPY backend/tsconfig.json ./

# Install backend dependencies
RUN npm install && npm cache clean --force

# Build backend TypeScript (shared package is now available)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy shared package first
COPY --from=builder /app/shared/package.json ./shared/
COPY --from=builder /app/shared/dist ./shared/dist

# Copy backend package files
COPY backend/package*.json ./

# Install only production dependencies (this will link the shared package)
RUN npm install --only=production && npm cache clean --force

# Copy built backend application
COPY --from=builder /app/backend/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]