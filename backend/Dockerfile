# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package*.json ./
COPY tsconfig*.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/

# Install all workspace dependencies (symlinks will be created)
RUN npm install

# Copy full source for backend and shared (needed to build)
COPY backend ./backend/
COPY shared ./shared/

# Build shared and backend
RUN npm run build --workspace=shared && \
    npm run build --workspace=backend
    

# ---------- Production ----------
FROM node:18-alpine AS production

WORKDIR /app

# Copy all necessary files
COPY package*.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY tsconfig*.json ./

# Copy full source layout so symlinks can be resolved
COPY backend ./backend/
COPY shared ./shared/

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Install prod dependencies (workspace-aware)
RUN npm install --omit=dev

# Set up user and entry
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000
CMD ["node", "backend/dist/index.js"]