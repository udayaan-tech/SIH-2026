const db = require('../services/db');
const CryptoService = require('../services/cryptoService');

/**
 * Universal Audit Logging Helper & Middleware
 * Implements tamper-evident event recording on all critical endpoints
 */
class AuditLogger {
  /**
   * Request ID injector middleware
   */
  static injectRequestId(req, res, next) {
    req.requestId = req.headers['x-request-id'] || CryptoService.generateRequestId();
    res.setHeader('X-Request-ID', req.requestId);
    next();
  }

  /**
   * Explicitly logs an audit event
   */
  static log({
    req,
    officer = null,
    action,
    resourceType,
    resourceId,
    resourceName = '',
    result = 'SUCCESS',
    reason = null
  }) {
    try {
      const user = officer || (req && req.user) || {
        id: 'usr-system',
        officer_id: 'SYSTEM',
        full_name: 'Automated System Process',
        designation: 'Security Subsystem'
      };

      const ip = (req && (req.ip || req.connection.remoteAddress)) || '127.0.0.1';
      const userAgent = (req && req.headers['user-agent']) || 'Internal Core Service';
      const endpoint = (req && req.originalUrl) || '/internal/action';
      const method = (req && req.method) || 'SYSTEM';
      const reqId = (req && req.requestId) || CryptoService.generateRequestId();
      const auditId = 'aud-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const logEntry = {
        timestamp,
        officer_id: user.officer_id,
        action,
        resource_id: resourceId,
        result,
        request_id: reqId
      };
      const checksum = CryptoService.generateAuditChecksum(logEntry);

      db.run(`
        INSERT INTO audit_logs (id, timestamp, user_id, officer_id, officer_name, department, action, resource_type, resource_id, resource_name, endpoint, http_method, ip_address, user_agent, result, reason, request_id, checksum)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        auditId,
        timestamp,
        user.id,
        user.officer_id,
        user.full_name,
        user.designation || user.department_name || 'NDIS',
        action,
        resourceType,
        resourceId,
        resourceName,
        endpoint,
        method,
        ip,
        userAgent,
        result,
        reason,
        reqId,
        checksum
      ]);

      return { auditId, reqId, checksum };
    } catch (err) {
      console.error('AuditLogger recording error:', err);
      return null;
    }
  }
}

module.exports = AuditLogger;
