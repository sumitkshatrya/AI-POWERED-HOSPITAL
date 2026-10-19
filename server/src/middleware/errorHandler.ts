import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const instance = req.originalUrl;

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      type: 'https://api.hospitalplatform.com/errors/VALIDATION_ERROR',
      title: 'Validation Error',
      status: 400,
      code: 'VALIDATION_ERROR',
      detail: 'One or more fields failed validation.',
      errors: formattedErrors,
      instance,
      timestamp,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      type: `https://api.hospitalplatform.com/errors/${err.code}`,
      title: err.name || 'Application Error',
      status: err.statusCode,
      code: err.code,
      message: err.message,
      detail: err.message,
      details: err.details,
      instance,
      timestamp,
    });
    return;
  }

  // Handle standard JWT token errors (expired / invalid signature / malformed)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    res.status(401).json({
      type: 'https://api.hospitalplatform.com/errors/UNAUTHORIZED',
      title: 'Unauthorized',
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid, malformed, or expired token.',
      detail: err.message,
      instance,
      timestamp,
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  res.status(500).json({
    type: 'https://api.hospitalplatform.com/errors/INTERNAL_SERVER_ERROR',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    detail: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred on the server.' : err.message,
    instance,
    timestamp,
  });
};

