# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY tsconfig*.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install all workspace deps
RUN npm install

# Copy sources
COPY backend ./backend/
COPY shared ./shared/

# Build all
RUN npm run build --workspace=shared && \
    npm run build --workspace=backend

# Pack both shared and backend
WORKDIR /app/shared
RUN mkdir /app/output && npm pack --pack-destination /app/output

WORKDIR /app/backend
RUN npm pack --pack-destination /app/output

# ---------- Production ----------
FROM node:18-alpine AS production

WORKDIR /app

# Copy both tarballs
COPY --from=builder /app/output/asap-cv-shared-*.tgz ./asap-cv-shared.tgz
COPY --from=builder /app/output/asap-cv-backend-*.tgz ./backend.tgz

# Install shared first, then backend
RUN npm install ./asap-cv-shared.tgz --omit=dev && \
    npm install ./backend.tgz --omit=dev

# Copy compiled backend code
COPY --from=builder /app/backend/dist ./dist

# Setup non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
CMD ["node", "dist/src/index.js"]