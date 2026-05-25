# Multi-stage build for production
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Backend build
FROM node:20-alpine AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# Copy client build
COPY --from=client-builder /app/client/dist ./client/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server/src/index.js"]
