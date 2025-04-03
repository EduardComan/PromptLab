import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Account } from '../models';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if user exists
    const user = await Account.findByPk(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'User not found or invalid token' });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    // Attach user to request object
    req.user = { id: user.id, username: user.username };

    // Continue to next middleware
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    
    res.status(500).json({ message: 'Server error during authentication' });
  }
}; 