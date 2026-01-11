import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required', details: 'No Authorization header found' });
      return;
    }

    // Check if header starts with "Bearer "
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Invalid authorization format', details: 'Authorization header must start with "Bearer "' });
      return;
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length < 2) {
      res.status(401).json({ error: 'Invalid authorization format', details: 'Token not found after "Bearer "' });
      return;
    }

    const token: string = tokenParts[1].trim();

    if (!token) {
      res.status(401).json({ error: 'Authentication required', details: 'No token found in Authorization header' });
      return;
    }

    // Validate token format (JWT should have 3 parts separated by dots)
    if (!token.includes('.') || token.split('.').length !== 3) {
      res.status(401).json({ 
        error: 'Invalid token format', 
        details: 'Token must be a valid JWT (should contain 3 parts separated by dots). Make sure you copied the complete token from login response.' 
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    if (!decoded.userId) {
      res.status(401).json({ error: 'Invalid token', details: 'Token does not contain userId' });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token', details: error.message });
      return;
    }
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired', details: error.message });
      return;
    }
    res.status(401).json({ error: 'Invalid or expired token', details: error.message });
  }
};
