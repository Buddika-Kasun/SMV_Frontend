import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { JWT_SECRET, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const userWithPass = await db.getUserByUsername(username);

    if (!userWithPass) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    if (!userWithPass.isActive) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact an Administrator.' });
    }

    let isValid = false;

    // Check PostgreSQL bcrypt hash or plaintext fallback
    if (userWithPass.passwordHash) {
      isValid = await bcrypt.compare(password, userWithPass.passwordHash);
    } else if (userWithPass.password) {
      isValid = userWithPass.password === password;
    } else {
      // Standard demo defaults
      if (userWithPass.username === 'sysadmin' && (password === 'admin123' || password === 'Admin@123')) {
        isValid = true;
      } else if (password === `${userWithPass.username}123` || password === 'Pass@123') {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid username or password.' });
    }

    // Sign JWT Token (expires in 7 days)
    const tokenPayload = {
      id: userWithPass.id,
      username: userWithPass.username,
      role: userWithPass.role,
      fullName: userWithPass.fullName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Clean user object (remove password/hash)
    const userSafe = {
      id: userWithPass.id,
      username: userWithPass.username,
      fullName: userWithPass.fullName,
      role: userWithPass.role,
      designation: userWithPass.designation,
      email: userWithPass.email,
      phone: userWithPass.phone,
      isActive: userWithPass.isActive,
      createdAt: userWithPass.createdAt,
      lastLogin: new Date().toISOString(),
    };

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    console.error('[Auth Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal authentication error' });
  }
});

/**
 * GET /api/auth/me - Verify current session
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    const user = await db.getUserByUsername(req.user.username);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const { password, passwordHash, ...safeUser } = user;
    return res.json({
      success: true,
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
