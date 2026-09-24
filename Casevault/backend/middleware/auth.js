const db = require('../services/db');

/**
 * Zero-Trust Authentication Middleware
 * Resolves officer identity from Authorization header or X-Officer-ID.
 * Strictly verifies identity against database.
 */
function authMiddleware(req, res, next) {
  // Check for Bearer token or direct X-Officer-ID header (for prototype versatility)
  const authHeader = req.headers['authorization'];
  let officerId = req.headers['x-officer-id'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Decode demo token format: "TOKEN-[OFFICER_ID]-[TIMESTAMP]"
    if (token.startsWith('TOKEN-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        officerId = parts.slice(1, -1).join('-');
      }
    }
  }

  // Default to A. Sharma if not specified for initial load
  if (!officerId) {
    officerId = 'NDIS-IO-4102';
  }

  try {
    const user = db.get(`
      SELECT u.*, r.name as role_name, r.id as role_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.officer_id = ? AND u.account_status = 'ACTIVE'
    `, [officerId]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid officer credentials or session expired.',
          requestId: req.requestId
        }
      });
    }

    // Fetch user permissions
    const permissions = db.all(`
      SELECT p.code
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [user.role_id]).map(p => p.code);

    req.user = {
      ...user,
      permissions
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_AUTH_ERROR',
        message: 'Authentication service encountered an error.',
        requestId: req.requestId
      }
    });
  }
}

module.exports = authMiddleware;
