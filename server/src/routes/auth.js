import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'bcf_carrom_admin_jwt_secret_key_2026';

/**
 * Verify password against salt:hash
 */
export function verifyPassword(password, storedHash) {
  try {
    if (!storedHash || !password) return false;
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Hash password securely
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Generate standard HMAC-SHA256 JWT
 */
function createToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // 7 days expiration
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Verify HMAC-SHA256 JWT
 */
function verifyToken(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Auth Middleware
 */
export async function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (authHeader) {
    token = authHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication session.' });
  }

  try {
    const [users] = await pool.query('SELECT id, email, name, role, status FROM admin_users WHERE id = ?', [payload.id]);
    if (users.length === 0 || users[0].status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Admin account not active or no longer exists.' });
    }

    req.admin = users[0];
    next();
  } catch (error) {
    console.error('[AUTH MIDDLEWARE ERROR]:', error);
    return res.status(500).json({ success: false, message: 'Server auth error' });
  }
}

/**
 * POST /api/auth/login
 * Admin Login Endpoint
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query admin user
    const [users] = await pool.query(
      'SELECT id, email, password_hash, name, role, status, last_login FROM admin_users WHERE LOWER(email) = ?',
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const user = users[0];

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: 'This admin account has been suspended or deactivated.'
      });
    }

    // Verify password
    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // Update last_login
    await pool.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [user.id]);

    const token = createToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        last_login: new Date()
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
      error: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Verify current admin session
 */
router.get('/me', requireAdminAuth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.admin.id,
      email: req.admin.email,
      name: req.admin.name,
      role: req.admin.role,
      status: req.admin.status
    }
  });
});

/**
 * POST /api/auth/logout
 * Admin Logout Endpoint
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * PUT & POST /api/auth/update-password & /api/auth/change-password
 * Change password for authenticated admin
 */
const handlePasswordUpdate = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const [users] = await pool.query('SELECT password_hash FROM admin_users WHERE id = ?', [req.admin.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = verifyPassword(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    await pool.query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [newHash, req.admin.id]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('[PASSWORD UPDATE ERROR]:', error);
    res.status(500).json({ success: false, message: 'Failed to update password' });
  }
};

router.put('/update-password', requireAdminAuth, handlePasswordUpdate);
router.post('/update-password', requireAdminAuth, handlePasswordUpdate);
router.put('/change-password', requireAdminAuth, handlePasswordUpdate);
router.post('/change-password', requireAdminAuth, handlePasswordUpdate);

export default router;
