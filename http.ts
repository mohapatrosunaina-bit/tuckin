import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface StandardError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const reqId = (req.header('x-request-id') as string) || randomUUID();
  res.locals.requestId = reqId;
  res.setHeader('x-request-id', reqId);
  next();
}

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

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
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

  // Fallback 500 without leaking stack in production
  console.error(`[${requestId}] Internal Server Error:`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred',
      requestId
    }
  });
}
