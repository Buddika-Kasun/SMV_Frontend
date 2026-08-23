import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../../src/types';

export const JWT_SECRET = process.env.JWT_SECRET || 'smv-holdings-secure-key-change-in-production-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
    fullName: string;
  };
}

/**
 * Authentication middleware that verifies the JWT Bearer token
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token is passed, allow as guest or handle in route
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired authentication token.' });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Role-Based Access Control middleware
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: `Access forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}].` 
      });
    }

    next();
  };
}
