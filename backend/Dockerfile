# Stage 1: Build shared package
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and lock file first
COPY package*.json ./

# Copy all source code (so npm can build workspace packages)
COPY . .

# Install all dependencies for all workspaces
RUN npm install

# Build shared and backend
RUN npm run build --workspace=shared && \
    npm run build --workspace=backend

# Stage 2: Run production
FROM node:18-alpine AS production
WORKDIR /app

# Copy only the backend dist and runtime dependencies
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Optional: if shared types are used at runtime, also copy its dist
COPY --from=builder /app/shared/dist ./node_modules/asap-cv-shared/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
    
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