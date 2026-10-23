import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { SEED_RESTAURANTS, SEED_MENU_ITEMS } from './data.js';

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

export function createApp() {
  const app = express();
  app.use(express.json());

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.header('x-request-id') as string) || randomUUID();
    res.locals.requestId = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Health checks
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'live', service: 'restaurant-service' });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ready', service: 'restaurant-service' });
  });

  // API Routes
  app.get('/api/restaurants', (_req: Request, res: Response) => {
    res.status(200).json({ restaurants: SEED_RESTAURANTS });
  });

  app.get('/api/restaurants/:restaurantId', (req: Request, res: Response, next: NextFunction) => {
    const restaurant = SEED_RESTAURANTS.find((r) => r.id === req.params.restaurantId);
    if (!restaurant) {
      return next(new AppError(404, 'RESTAURANT_NOT_FOUND', `Restaurant with ID '${req.params.restaurantId}' not found`));
    }
    res.status(200).json(restaurant);
  });

  app.get('/api/restaurants/:restaurantId/menu', (req: Request, res: Response, next: NextFunction) => {
    const restaurant = SEED_RESTAURANTS.find((r) => r.id === req.params.restaurantId);
    if (!restaurant) {
      return next(new AppError(404, 'RESTAURANT_NOT_FOUND', `Restaurant with ID '${req.params.restaurantId}' not found`));
    }
    const items = SEED_MENU_ITEMS.filter((item) => item.restaurantId === req.params.restaurantId);
    res.status(200).json({ restaurantId: restaurant.id, items });
  });

  app.get('/api/menu-items/:itemId', (req: Request, res: Response, next: NextFunction) => {
    const item = SEED_MENU_ITEMS.find((i) => i.id === req.params.itemId);
    if (!item) {
      return next(new AppError(404, 'MENU_ITEM_NOT_FOUND', `Menu item with ID '${req.params.itemId}' not found`));
    }
    res.status(200).json(item);
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
