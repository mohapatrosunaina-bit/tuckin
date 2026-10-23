import express, { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { DeliveryStore, DeliveryStatus } from './domain.js';

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

export interface AppOptions {
  store?: DeliveryStore;
}

export function createApp(options?: AppOptions) {
  const app = express();
  app.use(express.json());

  const store = options?.store || new DeliveryStore();

  // Request ID middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.header('x-request-id') as string) || randomUUID();
    res.locals.requestId = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Health checks
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'live', service: 'delivery-service' });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ready', service: 'delivery-service' });
  });

  // GET /api/delivery/:orderId - Delivery status and ETA
  app.get('/api/delivery/:orderId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId as string;
      if (!orderId) {
        return next(new AppError(400, 'INVALID_INPUT', 'orderId parameter is required'));
      }
      const tracking = store.get(orderId);

      const isCanary = process.env.CANARY_RELEASE === 'true' || process.env.FEATURE_AI_ETA_ENABLED === 'true';
      if (isCanary) {
        res.setHeader('x-track-version', 'v2-canary-eta');
        return res.status(200).json({
          ...tracking,
          etaModel: 'ai-traffic-aware-v2',
          confidenceScore: 0.94
        });
      }

      res.setHeader('x-track-version', 'v1-stable');
      res.status(200).json(tracking);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/delivery/:orderId/simulate-next - Advance simulation milestone
  app.post('/api/delivery/:orderId/simulate-next', (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId as string;
      if (!orderId) {
        return next(new AppError(400, 'INVALID_INPUT', 'orderId parameter is required'));
      }
      const updated = store.simulateNext(orderId);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/delivery/:orderId/status - Synchronize with external status update (e.g. restaurant actions)
  app.post('/api/delivery/:orderId/status', (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId as string;
      const { status } = req.body as { status?: DeliveryStatus };
      if (!orderId || !status) {
        return next(new AppError(400, 'INVALID_INPUT', 'orderId and status are required'));
      }
      const updated = store.setStatus(orderId, status);
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
