import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((error: ValidationError) => {
        const field = 'path' in error 
          ? error.path 
          : ('param' in error ? error.param : 'unknown');
        
        return {
          field,
          message: error.msg
        };
      })
    });
    return;
  }
  
  next();
}; 