const db = require('../services/db');
const CryptoService = require('../services/cryptoService');

/**
 * Role-Based Access Control and Object-Level Authorization Middleware
 */
class RBAC {
  /**
   * Requires a specific permission (e.g. 'UPLOAD', 'DOWNLOAD', 'VERIFY', 'AUDIT')
   */
  static requirePermission(requiredPermission) {
    return (req, res, next) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
        });
      }

      // Admin has all permissions
      if (user.role_id === 'role-admin') {
        return next();
      }

      if (!user.permissions || !user.permissions.includes(requiredPermission)) {
        // Record unauthorized attempt in audit log and security events
        RBAC.logAccessDenied(req, `Lacks required permission: ${requiredPermission}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `ACCESS DENIED: Officer ${user.officer_id} does not possess the '${requiredPermission}' authorization credential.`,
            requestId: req.requestId
          }
        });
      }

      next();
    };
  }

  /**
   * Enforces Object-Level Authorization on Case Access (BOLA / IDOR Defense)
   */
  static authorizeCaseAccess(req, res, next) {
    const user = req.user;
    const caseId = req.params.id || req.body.case_id;

    if (!caseId) return next();

    // Administrators and Auditors have system-wide read access
    if (user.role_id === 'role-admin' || user.role_id === 'role-aud') {
      return next();
    }

    try {
      const caseItem = db.get('SELECT * FROM cases WHERE id = ? OR case_number = ?', [caseId, caseId]);
      if (!caseItem) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Case not found', requestId: req.requestId }
        });
      }

      // Check if user belongs to same department or is assigned member
      const isMember = db.get('SELECT * FROM case_members WHERE case_id = ? AND user_id = ?', [caseItem.id, user.id]);
      const isSameDept = user.department_id === caseItem.department_id;
      const isLead = user.id === caseItem.lead_officer_id;

      if (!isMember && !isSameDept && !isLead) {
        RBAC.logAccessDenied(req, `Attempted unauthorized access to cross-jurisdiction Case ${caseItem.case_number}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `ACCESS DENIED: Case ${caseItem.case_number} is restricted to authorized personnel in ${caseItem.jurisdiction}.`,
            requestId: req.requestId
          }
        });
      }

      req.currentCase = caseItem;
      next();
    } catch (e) {
      console.error('Case authorization error:', e);
      next();
    }
  }

  /**
   * Logs access denied to audit logs and security events
   */
  static logAccessDenied(req, reason) {
    try {
      const user = req.user || { id: 'unknown', officer_id: 'UNKNOWN', full_name: 'Unknown Officer', department_name: 'External' };
      const reqId = req.requestId || CryptoService.generateRequestId();
      const ip = req.ip || req.connection.remoteAddress || '10.42.0.1';

      // 1. Audit Log
      const auditId = 'aud-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
      const logEntry = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        officer_id: user.officer_id,
        action: 'ACCESS_DENIED',
        resource_id: req.params.id || req.originalUrl,
        result: 'DENIED',
        request_id: reqId
      };
      const checksum = CryptoService.generateAuditChecksum(logEntry);

      db.run(`
        INSERT INTO audit_logs (id, timestamp, user_id, officer_id, officer_name, department, action, resource_type, resource_id, resource_name, endpoint, http_method, ip_address, user_agent, result, reason, request_id, checksum)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        auditId,
        logEntry.timestamp,
        user.id,
        user.officer_id,
        user.full_name,
        user.designation || user.department_name,
        'ACCESS_DENIED',
        'SECURITY_POLICY',
        req.params.id || 'ENDPOINT',
        req.originalUrl,
        req.originalUrl,
        req.method,
        ip,
        req.headers['user-agent'] || 'GovNet Browser',
        'DENIED',
        reason,
        reqId,
        checksum
      ]);

      // 2. Security Event
      const secId = 'sec-' + Date.now().toString(36);
      db.run(`
        INSERT INTO security_events (id, timestamp, event_type, severity, description, source_ip, officer_id, resource_id, status)
        VALUES (?, datetime('now'), 'UNAUTHORIZED_ACCESS_BLOCKED', 'CRITICAL', ?, ?, ?, ?, 'ACTIVE')
      `, [
        secId,
        `Blocked unauthorized ${req.method} request on ${req.originalUrl} by ${user.officer_id}. Reason: ${reason}`,
        ip,
        user.officer_id,
        req.params.id || 'GLOBAL'
      ]);
    } catch (err) {
      console.error('Error logging access denied:', err);
    }
  }
}

module.exports = RBAC;
