import { Response } from 'express';
import { ApiError } from '../types';
import logger from './logger';

export class AppError extends Error {
  public readonly status: number;
  public readonly isOperational: boolean;

  constructor(message: string, status: number, isOperational: boolean = true) {
    super(message);
    this.status = status;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

// Error handler for controllers
export const handleError = (error: unknown, res: Response): void => {
  logger.error('Error:', error);
  
  if (error instanceof AppError) {
    const response: ApiError = {
      message: error.message,
      status: error.status
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.error = error.stack;
    }
    
    res.status(error.status).json(response);
    return;
  }
  
  // Generic error
  const response: ApiError = {
    message: 'An unexpected error occurred',
    status: 500
  };
  
  // Add error details in development
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    response.error = error.message;
  }
  
  res.status(500).json(response);
}; 