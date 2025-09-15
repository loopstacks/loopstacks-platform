import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error
  logger.error('API Error:', {
    error: message,
    statusCode,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
export const createNotFoundError = (resource: string) => {
  return new AppError(`${resource} not found`, 404);
};

export const createValidationError = (message: string) => {
  return new AppError(`Validation Error: ${message}`, 400);
};

export const createUnauthorizedError = (message: string = 'Unauthorized') => {
  return new AppError(message, 401);
};

export const createForbiddenError = (message: string = 'Forbidden') => {
  return new AppError(message, 403);
};

export const createConflictError = (message: string) => {
  return new AppError(`Conflict: ${message}`, 409);
};

export const createInternalError = (message: string = 'Internal Server Error') => {
  return new AppError(message, 500);
};