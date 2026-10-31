import express from 'express';
import pool from '../config/db.js';
import { requireAdminAuth, hashPassword } from './auth.js';

const router = express.Router();

// All users routes require admin authentication
router.use(requireAdminAuth);

/**
 * GET /api/users
 * List all admin users
 */
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, name, avatar_url, role, designation, position, phone, status, last_login, created_at 
       FROM admin_users 
       ORDER BY id ASC`
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('[USERS GET ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * GET /api/users/:id
 * Get single admin user
 */
router.get('/:id', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, name, avatar_url, role, designation, position, phone, status, last_login, created_at 
       FROM admin_users 
       WHERE id = ?`,
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'Admin',
      designation = '',
      position = '',
      phone = '',
      avatar_url = '',
      status = 'Active'
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const [existing] = await pool.query('SELECT id FROM admin_users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const passwordHash = hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role, designation, position, phone, avatar_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        cleanEmail,
        passwordHash,
        role || 'Admin',
        designation || null,
        position || null,
        phone || null,
        avatar_url || null,
        status || 'Active'
      ]
    );

    const newUserId = result.insertId;

    const [created] = await pool.query(
      `SELECT id, email, name, avatar_url, role, designation, position, phone, status, last_login, created_at 
       FROM admin_users WHERE id = ?`,
      [newUserId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: created[0]
    });
  } catch (error) {
    console.error('[USERS CREATE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
});

/**
 * PUT /api/users/:id
 * Update an existing user
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      name,
      email,
      password,
      role,
      designation,
      position,
      phone,
      avatar_url,
      status
    } = req.body;

    const [existing] = await pool.query('SELECT id, password_hash FROM admin_users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const [emailCheck] = await pool.query('SELECT id FROM admin_users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, userId]);
      if (emailCheck.length > 0) {
        return res.status(409).json({ success: false, message: 'Another user is already using this email.' });
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email.trim().toLowerCase());
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (designation !== undefined) {
      updates.push('designation = ?');
      values.push(designation);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (password && password.trim().length >= 6) {
      updates.push('password_hash = ?');
      values.push(hashPassword(password.trim()));
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await pool.query(
      `SELECT id, email, name, avatar_url, role, designation, position, phone, status, last_login, created_at 
       FROM admin_users WHERE id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updated[0]
    });
  } catch (error) {
    console.error('[USERS UPDATE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

/**
 * PATCH /api/users/:id/status
 * Toggle user active/inactive status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    const [existing] = await pool.query('SELECT id, status FROM admin_users WHERE id = ?', [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = status || (existing[0].status === 'Active' ? 'Inactive' : 'Active');

    await pool.query('UPDATE admin_users SET status = ? WHERE id = ?', [newStatus, userId]);

    res.json({
      success: true,
      message: `User status changed to ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Safety: prevent self-deletion
    if (req.admin && String(req.admin.id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own logged-in account.'
      });
    }

    // Safety: prevent deleting last user
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM admin_users');
    if (countResult[0].total <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining admin user.'
      });
    }

    await pool.query('DELETE FROM admin_users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('[USERS DELETE ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

export default router;

