# Multi-stage build for Delivery Service
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
COPY services/delivery-service ./services/delivery-service

RUN npm run build --workspace=@tuckin/delivery-service

# Production runner stage
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003

# Run as non-root user
USER node

COPY --chown=node:node --from=builder /app/package.json /app/package-lock.json ./
COPY --chown=node:node --from=builder /app/services/delivery-service/package.json ./services/delivery-service/
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/services/delivery-service/dist ./services/delivery-service/dist

EXPOSE 3003

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003/health/live || exit 1

CMD ["node", "services/delivery-service/dist/index.js"]
