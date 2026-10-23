# Multi-stage build for React Frontend
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json* ./
COPY services/restaurant-service/package.json ./services/restaurant-service/
COPY services/order-service/package.json ./services/order-service/
COPY services/delivery-service/package.json ./services/delivery-service/
COPY frontend/package.json ./frontend/

RUN npm ci

COPY frontend/ ./frontend/

RUN npm run build --workspace=@tuckin/frontend

# Runtime stage with Nginx Alpine
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
