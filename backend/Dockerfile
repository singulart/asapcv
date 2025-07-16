# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root + workspace manifests
COPY package*.json ./
COPY tsconfig*.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install all workspace deps
RUN npm install

# Copy actual source code
COPY backend ./backend/
COPY shared ./shared/

# Build backend and shared
RUN npm run build --workspace=shared && \
    npm run build --workspace=backend

# Pack the backend (like an npm publish)
WORKDIR /app/backend
RUN mkdir -p /app/output && npm pack --pack-destination /app/output
    

# ---------- Production ----------
FROM node:18-alpine AS production

WORKDIR /app

# Copy the backend tarball (flattened bundle)
COPY --from=builder /app/output/asap-cv-backend-*.tgz ./backend.tgz

# Install as if from a registry
RUN npm install ./backend.tgz --omit=dev

# Copy compiled backend code
COPY --from=builder /app/backend/dist ./dist

# Setup non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["node", "dist/src/index.js"]