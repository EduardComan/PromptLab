import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import logger from '../utils/logger';

// Define user interface
interface JwtPayload {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
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
    const decoded = jwt.verify(token, JWT_SECRET as jwt.Secret) as JwtPayload;

    // Check if user exists
    const user = await prisma.account.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      res.status(401).json({ message: 'User not found or invalid token' });
      return;
    }

    // Attach user to request object
    req.user = { id: user.id, username: user.username };

    // Continue to next middleware
    next();
  } catch (error: unknown) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }
    
    res.status(500).json({ message: 'Server error during authentication' });
  }
}; 