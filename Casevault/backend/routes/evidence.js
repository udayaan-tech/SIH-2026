const express = require('express');
const router = express.Router();
const db = require('../services/db');
const RBAC = require('../middleware/rbac');
const AuditLogger = require('../middleware/auditLogger');
const CryptoService = require('../services/cryptoService');

// List Evidence
router.get('/', (req, res) => {
  const { caseId, evidenceType, integrityStatus, custodian, search } = req.query;

  let query = `
    SELECT ev.*,
           c.case_number, c.title as case_title,
           u1.full_name as collector_name, u1.officer_id as collector_code,
           u2.full_name as custodian_name, u2.officer_id as custodian_code,
           d.name as custodian_department
    FROM evidence ev
    LEFT JOIN cases c ON ev.case_id = c.id
    LEFT JOIN users u1 ON ev.collected_by = u1.id
    LEFT JOIN users u2 ON ev.current_custodian_id = u2.id
    LEFT JOIN departments d ON u2.department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (caseId && caseId !== 'ALL') {
    query += ' AND (ev.case_id = ? OR c.case_number = ?)';
    params.push(caseId, caseId);
  }
  if (evidenceType && evidenceType !== 'ALL') {
    query += ' AND ev.evidence_type = ?';
    params.push(evidenceType);
  }
  if (integrityStatus && integrityStatus !== 'ALL') {
    query += ' AND ev.integrity_status = ?';
    params.push(integrityStatus);
  }
  if (custodian && custodian !== 'ALL') {
    query += ' AND (ev.current_custodian_id = ? OR u2.full_name LIKE ?)';
    params.push(custodian, `%${custodian}%`);
  }
  if (search) {
    query += ' AND (ev.title LIKE ? OR ev.evidence_number LIKE ? OR ev.description LIKE ? OR ev.serial_barcode LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY ev.created_at DESC';

  const items = db.all(query, params);
  res.json({ success: true, data: items, count: items.length });
});

// Single Evidence Detail with Chain of Custody
router.get('/:id', (req, res) => {
  const ev = db.get(`
    SELECT ev.*,
           c.case_number, c.title as case_title, c.jurisdiction,
           u1.full_name as collector_name, u1.officer_id as collector_code, u1.badge_number as collector_badge,
           u2.full_name as custodian_name, u2.officer_id as custodian_code, u2.designation as custodian_designation,
           d.name as custodian_department
    FROM evidence ev
    LEFT JOIN cases c ON ev.case_id = c.id
    LEFT JOIN users u1 ON ev.collected_by = u1.id
    LEFT JOIN users u2 ON ev.current_custodian_id = u2.id
    LEFT JOIN departments d ON u2.department_id = d.id
    WHERE ev.id = ? OR ev.evidence_number = ?
  `, [req.params.id, req.params.id]);

  if (!ev) {
    return res.status(404).json({ success: false, error: { message: 'Evidence record not found' } });
  }

  // Chain of Custody records
  const chain = db.all(`
    SELECT coc.*,
           u1.full_name as from_officer_name, u1.officer_id as from_officer_code,
           u2.full_name as to_officer_name, u2.officer_id as to_officer_code
    FROM chain_of_custody coc
    LEFT JOIN users u1 ON coc.from_officer_id = u1.id
    LEFT JOIN users u2 ON coc.to_officer_id = u2.id
    WHERE coc.evidence_id = ?
    ORDER BY coc.timestamp ASC
  `, [ev.id]);

  AuditLogger.log({
    req,
    action: 'EVIDENCE_VIEW',
    resourceType: 'EVIDENCE',
    resourceId: ev.id,
    resourceName: `${ev.evidence_number} — ${ev.title}`,
    result: 'SUCCESS'
  });

  res.json({
    success: true,
    data: {
      ...ev,
      chainOfCustody: chain
    }
  });
});

// Register Evidence
router.post('/', RBAC.requirePermission('UPLOAD'), (req, res) => {
  const { caseId, title, description, evidenceType, collectionLocation, storageLocation, serialBarcode } = req.body;

  if (!title || !evidenceType) {
    return res.status(400).json({ success: false, error: { message: 'Title and evidence type are required' } });
  }

  const countRow = db.get("SELECT COUNT(*) as c FROM evidence");
  const evId = 'ev-' + String(countRow.c + 1).padStart(3, '0');
  const evNumber = `EVD-2026-041-${String(countRow.c + 1).padStart(2, '0')}`;
  const user = req.user || { id: 'usr-sharma', officer_id: 'NDIS-IO-4102', full_name: 'A. Sharma' };
  const targetCase = caseId || 'case-041';
  const sha256 = CryptoService.generateSha256(`EVIDENCE-VAULT-${evNumber}-${Date.now()}`);
  const signature = CryptoService.generateDigitalSignature(user.officer_id, sha256);
  const today = new Date().toISOString().substring(0, 10);

  db.run(`
    INSERT INTO evidence (id, evidence_number, case_id, title, description, evidence_type, collected_by, collection_date, collection_location, storage_location, current_custodian_id, integrity_status, sha256_hash, digital_signature, serial_barcode, custody_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SECURE', ?, ?, ?, 'STORED')
  `, [
    evId,
    evNumber,
    targetCase,
    title,
    description || 'Seized evidence item logged into secure digital evidence vault.',
    evidenceType,
    user.id,
    today,
    collectionLocation || 'Investigation Site',
    storageLocation || 'Central Vault',
    user.id,
    sha256,
    signature,
    serialBarcode || `BAR-${Date.now()}`
  ]);

  // Initial custody record
  db.run(`
    INSERT INTO chain_of_custody (id, evidence_id, action_type, from_officer_id, to_officer_id, from_department, to_department, transfer_reason, storage_location, digital_signature, sha256_verification)
    VALUES (?, ?, 'COLLECTED', NULL, ?, 'Seizure Site', 'NDIS Secure Evidence Vault', 'Initial evidentiary seizure under legal warrant', ?, ?, ?)
  `, [
    'coc-' + Date.now().toString(36),
    evId,
    user.id,
    storageLocation || 'Vault Locker 1',
    signature,
    sha256
  ]);

  AuditLogger.log({
    req,
    action: 'EVIDENCE_REGISTER',
    resourceType: 'EVIDENCE',
    resourceId: evId,
    resourceName: `${evNumber} - ${title}`,
    result: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Evidence successfully registered into vault.',
    data: { id: evId, evidenceNumber: evNumber, sha256Hash: sha256 }
  });
});

// Transfer Evidence Chain of Custody (Section 34.23)
router.post('/:id/transfer', RBAC.requirePermission('TRANSFER'), (req, res) => {
  const { toOfficerId, transferReason, newStorageLocation, actionType } = req.body;
  const user = req.user;

  const ev = db.get('SELECT * FROM evidence WHERE id = ? OR evidence_number = ?', [req.params.id, req.params.id]);
  if (!ev) {
    return res.status(404).json({ success: false, error: { message: 'Evidence not found' } });
  }

  // Look up target officer
  const targetOfficer = db.get(`
    SELECT u.*, d.name as department_name FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ? OR u.officer_id = ?
  `, [toOfficerId, toOfficerId]);

  if (!targetOfficer) {
    return res.status(400).json({ success: false, error: { message: 'Receiving officer not found' } });
  }

  const cocId = 'coc-' + Date.now().toString(36);
  const digitalSignature = CryptoService.generateDigitalSignature(targetOfficer.officer_id, ev.sha256_hash);
  const act = actionType || 'TRANSFERRED';
  const reason = transferReason || `Transfer of custody to ${targetOfficer.full_name} for forensic extraction.`;
  const location = newStorageLocation || targetOfficer.department_name + ' Secure Lab';

  // 1. Insert Chain of Custody Hop
  db.run(`
    INSERT INTO chain_of_custody (id, evidence_id, action_type, from_officer_id, to_officer_id, from_department, to_department, transfer_reason, storage_location, digital_signature, sha256_verification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    cocId,
    ev.id,
    act,
    user.id,
    targetOfficer.id,
    user.department_name || 'NDIS',
    targetOfficer.department_name || 'NDIS',
    reason,
    location,
    digitalSignature,
    ev.sha256_hash
  ]);

  // 2. Update Evidence current custodian
  db.run(`
    UPDATE evidence
    SET current_custodian_id = ?, storage_location = ?, custody_state = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [targetOfficer.id, location, act === 'EXAMINED' ? 'EXAMINED' : 'TRANSFERRED', ev.id]);

  // 3. Immutable Audit Log
  AuditLogger.log({
    req,
    action: 'EVIDENCE_TRANSFER',
    resourceType: 'EVIDENCE',
    resourceId: ev.id,
    resourceName: `${ev.evidence_number} -> ${targetOfficer.full_name} (${targetOfficer.officer_id})`,
    result: 'SUCCESS'
  });

  res.json({
    success: true,
    message: `Chain of Custody successfully updated. Custody transferred to Officer ${targetOfficer.full_name}.`,
    data: {
      evidenceId: ev.evidence_number,
      fromOfficer: user.full_name,
      toOfficer: targetOfficer.full_name,
      toDepartment: targetOfficer.department_name,
      actionType: act,
      digitalSignature,
      sha256Verification: ev.sha256_hash,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
