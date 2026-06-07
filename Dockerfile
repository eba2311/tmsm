# Multi-stage build for production
# Build timestamp: $(date)
FROM node:22-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Backend build
FROM node:22-alpine AS backend-builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./

# Production image
FROM node:22-alpine AS production

WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/server ./server
COPY --from=backend-builder /app/server/node_modules ./server/node_modules

# Copy client build
COPY --from=client-builder /app/client/dist ./client/dist

# Copy environment file for production
COPY server/.env.production ./server/.env

# Copy startup script
COPY server/start.sh ./start.sh
RUN chmod +x ./start.sh

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start server
CMD ["./start.sh"]
