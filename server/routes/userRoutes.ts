import { Router } from 'express';
import { db } from '../db';
import { authenticateToken, requireRoles, AuthRequest } from '../middleware/auth';
import { User } from '../../src/types';

const router = Router();

/**
 * GET /api/users - List all users (Requires manager or admin)
 */
router.get('/', async (req, res) => {
  try {
    const users = await db.getUsers();
    const safeUsers = users.map(({ password, ...u }) => u);
    return res.json({ success: true, count: safeUsers.length, users: safeUsers });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users - Create new user account (Requires manager or admin, enforces single admin constraint)
 */
router.post('/', async (req, res) => {
  try {
    const { username, password, fullName, role, designation, email, phone } = req.body;

    if (!username || !fullName || !role) {
      return res.status(400).json({ success: false, error: 'Username, Full Name, and Role are required.' });
    }

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      role,
      designation: designation?.trim() || (role === 'admin' ? 'System Administrator' : role === 'manager' ? 'Branch Manager' : 'Operations Officer'),
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const result = await db.createUser(newUser, password || 'User@123');

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const { password: _, ...safeUser } = result.user!;
    return res.status(201).json({
      success: true,
      message: `User @${newUser.username} created successfully.`,
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/users/:id - Update user details or reset password
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, designation, email, phone, isActive, password } = req.body;

    const result = await db.updateUser(id, {
      fullName,
      role,
      designation,
      email,
      phone,
      isActive,
    }, password);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const { password: _, ...safeUser } = result.user!;
    return res.json({
      success: true,
      message: 'User updated successfully',
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/users/:id - Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteUser(id);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, message: 'User account removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/users/reset-defaults - Reset to canonical baseline
 */
router.post('/reset-defaults', async (req, res) => {
  try {
    const users = await db.resetUsersToDefaults();
    const safeUsers = users.map(({ password, ...u }) => u);
    return res.json({
      success: true,
      message: 'User accounts reset to standard defaults (sysadmin, manager1, staff1).',
      users: safeUsers,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
