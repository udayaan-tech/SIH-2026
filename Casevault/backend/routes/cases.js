const express = require('express');
const router = express.Router();
const db = require('../services/db');
const RBAC = require('../middleware/rbac');
const AuditLogger = require('../middleware/auditLogger');
const CryptoService = require('../services/cryptoService');

// List Cases with full filters
router.get('/', (req, res) => {
  const { status, department, officer, priority, caseType, search } = req.query;

  let query = `
    SELECT c.*,
           d.name as department_name, d.code as department_code,
           u.full_name as lead_officer_name, u.officer_id as lead_officer_code,
           (SELECT COUNT(*) FROM documents doc WHERE doc.case_id = c.id) as document_count,
           (SELECT COUNT(*) FROM evidence ev WHERE ev.case_id = c.id) as evidence_count,
           (SELECT COUNT(*) FROM case_members cm WHERE cm.case_id = c.id) as member_count
    FROM cases c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.lead_officer_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'ALL') {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (department && department !== 'ALL') {
    query += ' AND (c.department_id = ? OR d.code = ?)';
    params.push(department, department);
  }
  if (officer && officer !== 'ALL') {
    query += ' AND (c.lead_officer_id = ? OR u.full_name LIKE ?)';
    params.push(officer, `%${officer}%`);
  }
  if (priority && priority !== 'ALL') {
    query += ' AND c.priority = ?';
    params.push(priority);
  }
  if (caseType && caseType !== 'ALL') {
    query += ' AND c.case_type = ?';
    params.push(caseType);
  }
  if (search) {
    query += ' AND (c.case_number LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR c.fir_number LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY c.created_at DESC';

  const casesList = db.all(query, params);
  res.json({ success: true, data: casesList, count: casesList.length });
});

// Case Statistics for Dashboard
router.get('/statistics', (req, res) => {
  const stats = {
    activeCases: db.get("SELECT COUNT(*) as c FROM cases WHERE status = 'ACTIVE'").c,
    totalDocuments: db.get("SELECT COUNT(*) as c FROM documents").c,
    evidenceRecords: db.get("SELECT COUNT(*) as c FROM evidence").c,
    pendingReviews: db.get("SELECT COUNT(*) as c FROM documents WHERE verification_status = 'UNDER REVIEW'").c,
    auditEvents: db.get("SELECT COUNT(*) as c FROM audit_logs").c,
    securityAlerts: db.get("SELECT COUNT(*) as c FROM security_events WHERE status = 'ACTIVE'").c
  };
  res.json({ success: true, data: stats });
});

// Single Case Details
router.get('/:id', RBAC.authorizeCaseAccess, (req, res) => {
  const caseId = req.params.id;

  const caseItem = db.get(`
    SELECT c.*,
           d.name as department_name, d.code as department_code,
           u.full_name as lead_officer_name, u.officer_id as lead_officer_code, u.badge_number as lead_officer_badge,
           (SELECT COUNT(*) FROM documents doc WHERE doc.case_id = c.id) as document_count,
           (SELECT COUNT(*) FROM evidence ev WHERE ev.case_id = c.id) as evidence_count,
           (SELECT COUNT(*) FROM case_members cm WHERE cm.case_id = c.id) as member_count,
           (SELECT COUNT(*) FROM audit_logs al WHERE al.resource_id = c.id OR al.resource_id = c.case_number) as audit_count
    FROM cases c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.lead_officer_id = u.id
    WHERE c.id = ? OR c.case_number = ?
  `, [caseId, caseId]);

  if (!caseItem) {
    return res.status(404).json({ success: false, error: { message: 'Case not found' } });
  }

  // Associated documents
  const docs = db.all(`
    SELECT doc.*, u.full_name as uploader_name, u.officer_id as uploader_code
    FROM documents doc
    LEFT JOIN users u ON doc.uploaded_by = u.id
    WHERE doc.case_id = ?
    ORDER BY doc.created_at DESC
  `, [caseItem.id]);

  // Associated evidence
  const evidence = db.all(`
    SELECT ev.*, u.full_name as custodian_name, u.officer_id as custodian_code
    FROM evidence ev
    LEFT JOIN users u ON ev.current_custodian_id = u.id
    WHERE ev.case_id = ?
    ORDER BY ev.created_at DESC
  `, [caseItem.id]);

  // Associated members
  const members = db.all(`
    SELECT cm.*, u.full_name, u.officer_id, u.designation, u.badge_number, r.name as role_name
    FROM case_members cm
    JOIN users u ON cm.user_id = u.id
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE cm.case_id = ?
  `, [caseItem.id]);

  // Log view
  AuditLogger.log({
    req,
    action: 'CASE_VIEW',
    resourceType: 'CASE',
    resourceId: caseItem.id,
    resourceName: `${caseItem.case_number} — ${caseItem.title}`,
    result: 'SUCCESS'
  });

  res.json({
    success: true,
    data: {
      ...caseItem,
      documents: docs,
      evidence: evidence,
      members: members
    }
  });
});

// Register New Case
router.post('/', RBAC.requirePermission('CREATE_CASE'), (req, res) => {
  const { title, caseType, departmentId, jurisdiction, leadOfficerId, priority, confidentialityLevel, description, firNumber, actsSections } = req.body;

  if (!title || !caseType) {
    return res.status(400).json({ success: false, error: { message: 'Title and Case Type are required.' } });
  }

  // Calculate next sequential Case Number
  const countRow = db.get("SELECT COUNT(*) as c FROM cases");
  const caseNumber = CryptoService.generateCaseId(countRow.c + 42);
  const caseId = 'case-' + String(countRow.c + 42).padStart(3, '0');
  const openedDate = new Date().toISOString().substring(0, 10);

  const dept = departmentId || (req.user && req.user.department_id) || 'dept-eiu';
  const lead = leadOfficerId || (req.user && req.user.id) || 'usr-sharma';

  db.run(`
    INSERT INTO cases (id, case_number, title, case_type, department_id, jurisdiction, lead_officer_id, priority, status, confidentiality_level, description, investigation_progress, fir_number, acts_sections, date_opened)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, 10, ?, ?, ?)
  `, [
    caseId,
    caseNumber,
    title,
    caseType,
    dept,
    jurisdiction || 'National Jurisdiction',
    lead,
    priority || 'HIGH',
    confidentialityLevel || 'CONFIDENTIAL',
    description || 'New case opened for preliminary inquiry.',
    firNumber || `FIR-${caseNumber}`,
    actsSections || 'IPC 420',
    openedDate
  ]);

  // Assign creator as member
  db.run(`
    INSERT INTO case_members (case_id, user_id, access_level, assigned_by)
    VALUES (?, ?, 'ADMIN', ?)
  `, [caseId, req.user.id, req.user.id]);

  AuditLogger.log({
    req,
    action: 'CASE_CREATED',
    resourceType: 'CASE',
    resourceId: caseId,
    resourceName: `${caseNumber} - ${title}`,
    result: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Case successfully registered in government ledger.',
    data: {
      id: caseId,
      caseNumber,
      title
    }
  });
});

module.exports = router;
