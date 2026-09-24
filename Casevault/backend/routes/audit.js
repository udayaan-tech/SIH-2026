const express = require('express');
const router = express.Router();
const db = require('../services/db');
const RBAC = require('../middleware/rbac');

// Query Audit Trail with comprehensive filters
router.get('/', RBAC.requirePermission('AUDIT'), (req, res) => {
  const { date, user, action, caseId, department, result, search, limit = 100 } = req.query;

  let query = `
    SELECT al.*
    FROM audit_logs al
    WHERE 1=1
  `;
  const params = [];

  if (action && action !== 'ALL') {
    query += ' AND al.action = ?';
    params.push(action);
  }
  if (result && result !== 'ALL') {
    query += ' AND al.result = ?';
    params.push(result);
  }
  if (user && user !== 'ALL') {
    query += ' AND (al.officer_id = ? OR al.officer_name LIKE ?)';
    params.push(user, `%${user}%`);
  }
  if (department && department !== 'ALL') {
    query += ' AND al.department LIKE ?';
    params.push(`%${department}%`);
  }
  if (date) {
    query += ' AND al.timestamp LIKE ?';
    params.push(`${date}%`);
  }
  if (search) {
    query += ' AND (al.resource_name LIKE ? OR al.resource_id LIKE ? OR al.action LIKE ? OR al.reason LIKE ? OR al.ip_address LIKE ? OR al.request_id LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
  }

  query += ' ORDER BY al.timestamp DESC LIMIT ?';
  params.push(parseInt(limit) || 100);

  const logs = db.all(query, params);
  res.json({ success: true, data: logs, count: logs.length });
});

// Export Audit Report (CSV)
router.get('/export', RBAC.requirePermission('AUDIT'), (req, res) => {
  const logs = db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');

  const headers = ['Timestamp', 'Officer ID', 'Officer Name', 'Department', 'Action', 'Resource Type', 'Resource Name', 'Result', 'IP Address', 'Request ID', 'Ledger Checksum'];
  const csvRows = [headers.join(',')];

  for (const log of logs) {
    const row = [
      `"${log.timestamp}"`,
      `"${log.officer_id || ''}"`,
      `"${log.officer_name || ''}"`,
      `"${log.department || ''}"`,
      `"${log.action}"`,
      `"${log.resource_type}"`,
      `"${(log.resource_name || '').replace(/"/g, '""')}"`,
      `"${log.result}"`,
      `"${log.ip_address}"`,
      `"${log.request_id}"`,
      `"${log.checksum || ''}"`
    ];
    csvRows.push(row.join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="CASEVAULT_Audit_Compliance_Report_${new Date().toISOString().substring(0, 10)}.csv"`);
  res.send(csvRows.join('\n'));
});

module.exports = router;
