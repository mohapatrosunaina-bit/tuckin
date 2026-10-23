# Multi-stage build for Restaurant Service
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json tsconfig.json* ./
COPY services/restaurant-service/package.json ./services/restaurant-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/delivery-service/package.json ./services/delivery-service/
COPY services/common ./services/common
COPY frontend/package.json ./frontend/

RUN npm ci

# Copy service source code
COPY services/restaurant-service ./services/restaurant-service

RUN npm run build --workspace=@tuckin/restaurant-service

# Production runner stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/services/restaurant-service/package.json ./services/restaurant-service/
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/services/restaurant-service/dist ./services/restaurant-service/dist

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health/live || exit 1

CMD ["node", "services/restaurant-service/dist/index.js"]
