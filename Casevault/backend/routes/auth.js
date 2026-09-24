const express = require('express');
const router = express.Router();
const db = require('../services/db');
const AuditLogger = require('../middleware/auditLogger');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limiting on login: 15 attempts / min
router.post('/login', rateLimiter.limit({ windowMs: 60000, max: 15, message: 'Too many login attempts. Progressive security hold active.' }), (req, res) => {
  const { officerId, password, department, captcha } = req.body;

  if (!officerId) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_CREDENTIALS', message: 'Officer ID is required.', requestId: req.requestId }
    });
  }

  // Look up officer
  const user = db.get(`
    SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE (u.officer_id = ? OR u.email = ?) AND u.account_status = 'ACTIVE'
  `, [officerId, officerId]);

  if (!user) {
    AuditLogger.log({
      req,
      action: 'LOGIN_FAILED',
      resourceType: 'AUTH',
      resourceId: officerId,
      result: 'DENIED',
      reason: 'Invalid credentials or authentication temporarily unavailable'
    });

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid credentials or authentication temporarily unavailable.',
        requestId: req.requestId
      }
    });
  }

  // Generate demo session token: TOKEN-[OFFICER_ID]-[TIMESTAMP]
  const token = `TOKEN-${user.officer_id}-${Date.now()}`;

  // Update last login
  db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]);

  // Log successful login
  AuditLogger.log({
    req,
    officer: user,
    action: 'LOGIN_SUCCESS',
    resourceType: 'AUTH',
    resourceId: user.officer_id,
    resourceName: `Session established for ${user.full_name}`,
    result: 'SUCCESS'
  });

  // Fetch permissions
  const permissions = db.all(`
    SELECT p.code
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `, [user.role_id]).map(p => p.code);

  res.json({
    success: true,
    data: {
      token,
      officer: {
        id: user.id,
        officer_id: user.officer_id,
        full_name: user.full_name,
        email: user.email,
        badge_number: user.badge_number,
        designation: user.designation,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        role_id: user.role_id,
        role_name: user.role_name,
        mfa_enabled: Boolean(user.mfa_enabled),
        last_login: user.last_login,
        permissions
      }
    }
  });
});

// Current Officer Identity
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      officer: req.user
    }
  });
});

// Officer List for Demo Switcher
router.get('/officers', (req, res) => {
  const officers = db.all(`
    SELECT u.id, u.officer_id, u.full_name, u.badge_number, u.designation,
           r.name as role_name, r.id as role_id,
           d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    ORDER BY r.hierarchy_level DESC
  `);
  res.json({ success: true, data: officers });
});

// Officer Switcher (Convenient for Hackathon RBAC live demonstrations)
router.post('/switch-officer', (req, res) => {
  const { officerId } = req.body;
  const user = db.get(`
    SELECT u.*, r.name as role_name, d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.officer_id = ? OR u.id = ?
  `, [officerId, officerId]);

  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Officer not found' } });
  }

  const permissions = db.all(`
    SELECT p.code
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ?
  `, [user.role_id]).map(p => p.code);

  const token = `TOKEN-${user.officer_id}-${Date.now()}`;

  AuditLogger.log({
    req,
    officer: user,
    action: 'OFFICER_ROLE_SWITCH',
    resourceType: 'RBAC_SWITCH',
    resourceId: user.officer_id,
    resourceName: `Switched active session to ${user.full_name} (${user.role_name})`,
    result: 'SUCCESS'
  });

  res.json({
    success: true,
    data: {
      token,
      officer: {
        ...user,
        permissions
      }
    }
  });
});

module.exports = router;
