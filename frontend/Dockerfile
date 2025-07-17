# Multi-stage build for Angular frontend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY tsconfig*.json ./
COPY frontend/package.json ./frontend/
COPY shared/package.json ./shared/

# Install all workspace deps
RUN npm install

# Copy sources
COPY frontend ./frontend/
COPY shared ./shared/

# Build all
RUN npm run build --workspace=shared && \
    npm run build --workspace=frontend

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/frontend/dist/asap-cv-frontend /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port for Angular dev server
EXPOSE 4200

# Start development server
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "4200"]