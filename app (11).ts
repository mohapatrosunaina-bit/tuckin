import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import client from 'prom-client';
import {
  CreateOrderInput,
  OrderStatus,
  Order,
  calculateOrderItems,
  isValidTransition
} from './domain.js';
import { OrderStore, InMemoryOrderStore } from './store.js';
import { MenuItemResolver, createDefaultResolver } from './menuResolver.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Prometheus metrics setup
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'order_service_' });

export const ordersPlacedTotal = new client.Counter({
  name: 'order_service_orders_placed_total',
  help: 'Total number of orders successfully placed',
  registers: [register]
});

export const httpRequestsTotal = new client.Counter({
  name: 'order_service_http_requests_total',
  help: 'Total number of HTTP requests handled',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export interface AppOptions {
  store?: OrderStore;
  menuResolver?: MenuItemResolver;
}

export function createApp(options?: AppOptions) {
  const app = express();
  app.use(express.json());

  const store = options?.store || new InMemoryOrderStore();
  const menuResolver = options?.menuResolver || createDefaultResolver();

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.header('x-request-id') as string) || randomUUID();
    res.locals.requestId = reqId;
    res.setHeader('x-request-id', reqId);

    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status_code: res.statusCode.toString()
      });
    });

    next();
  });

  // Health checks
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'live', service: 'order-service' });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ready', service: 'order-service' });
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (_req: Request, res: Response) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  // GET /api/orders - List orders
  app.get('/api/orders', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await store.listOrders();
      res.status(200).json({ orders });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/orders/:orderId - Retrieve order details
  app.get('/api/orders/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId as string;
      const order = await store.getOrderById(orderId);
      if (!order) {
        return next(new AppError(404, 'ORDER_NOT_FOUND', `Order with ID '${orderId}' not found`));
      }
      res.status(200).json(order);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/orders - Create order with server-side totals and idempotency
  app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateOrderInput;
      const idempotencyKey = (req.header('idempotency-key') as string) || undefined;

      if (!body || !body.restaurantId || typeof body.restaurantId !== 'string') {
        return next(new AppError(400, 'INVALID_INPUT', 'Field restaurantId is required and must be a string'));
      }

      if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
        return next(new AppError(400, 'INVALID_INPUT', 'Field items must be a non-empty array'));
      }

      // Check idempotency key if provided
      if (idempotencyKey) {
        const existing = await store.getOrderByRestaurantAndIdempotencyKey(body.restaurantId, idempotencyKey);
        if (existing) {
          // Return the cached order response idempotently
          return res.status(200).json(existing);
        }
      }

      // Compute server-side items and totals using trusted resolver
      let calculated;
      try {
        calculated = calculateOrderItems(body.items, (id) => {
          const item = menuResolver(id);
          // Only sync or resolved items
          if (item instanceof Promise) {
            throw new Error('Async resolver should be resolved');
          }
          return item;
        });
      } catch (err: any) {
        const message = err.message || 'Error calculating order items';
        if (message.includes('unavailable')) {
          return next(new AppError(400, 'ITEM_UNAVAILABLE', message));
        }
        if (message.includes('not found')) {
          return next(new AppError(404, 'MENU_ITEM_NOT_FOUND', message));
        }
        return next(new AppError(400, 'INVALID_ORDER_ITEMS', message));
      }

      const orderId = randomUUID();
      const now = new Date().toISOString();

      const newOrder: Order = {
        id: orderId,
        restaurantId: body.restaurantId,
        status: 'PLACED',
        items: calculated.items,
        totalPaise: calculated.totalPaise,
        deliveryZone: body.deliveryZone || 'zone-central-demo',
        estimatedDeliveryMinutes: 35,
        idempotencyKey,
        createdAt: now,
        updatedAt: now
      };

      const saved = await store.createOrder(newOrder);
      ordersPlacedTotal.inc();

      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/orders/:orderId/status - Status transitions
  app.patch('/api/orders/:orderId/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status?: OrderStatus };
      if (!status || typeof status !== 'string') {
        return next(new AppError(400, 'INVALID_STATUS', 'Field status is required'));
      }

      const orderId = req.params.orderId as string;
      const existing = await store.getOrderById(orderId);
      if (!existing) {
        return next(new AppError(404, 'ORDER_NOT_FOUND', `Order with ID '${orderId}' not found`));
      }

      if (!isValidTransition(existing.status, status)) {
        return next(
          new AppError(
            409,
            'INVALID_STATE_TRANSITION',
            `Transition from ${existing.status} to ${status} is not allowed`
          )
        );
      }

      const updated = await store.updateOrderStatus(existing.id, status);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  });

  // 404 handler
  app.use((_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(404, 'NOT_FOUND', 'Route not found'));
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const requestId = (res.locals.requestId as string) || randomUUID();
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          requestId,
          ...(err.details ? { details: err.details } : {})
        }
      });
      return;
    }

    console.error(`[${requestId}] Internal Server Error:`, err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected internal server error occurred',
        requestId
      }
    });
  });

  return app;
}
