const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const CryptoService = require('./cryptoService');

// Ensure data and uploads directory exist
const DATA_DIR = path.join(__dirname, '../../data');
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'casevault.db');
let sqliteDb = null;

try {
  sqliteDb = new DatabaseSync(DB_PATH);
} catch (err) {
  console.error('Failed to initialize SQLite database:', err);
}

/**
 * Initializes the Database schema and seeds if empty
 */
function initDb() {
  if (!sqliteDb) return;

  // Enable WAL mode & foreign keys
  sqliteDb.exec('PRAGMA foreign_keys = ON;');

  // Create tables
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      jurisdiction TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      hierarchy_level INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT,
      permission_id TEXT,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      officer_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      department_id TEXT,
      role_id TEXT,
      badge_number TEXT NOT NULL UNIQUE,
      designation TEXT NOT NULL,
      phone TEXT,
      mfa_enabled INTEGER DEFAULT 1,
      account_status TEXT DEFAULT 'ACTIVE',
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      case_type TEXT NOT NULL,
      department_id TEXT,
      jurisdiction TEXT NOT NULL,
      lead_officer_id TEXT,
      priority TEXT DEFAULT 'HIGH',
      status TEXT DEFAULT 'ACTIVE',
      confidentiality_level TEXT DEFAULT 'CONFIDENTIAL',
      description TEXT,
      investigation_progress INTEGER DEFAULT 0,
      fir_number TEXT,
      acts_sections TEXT,
      date_opened TEXT NOT NULL,
      date_closed TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS case_members (
      case_id TEXT,
      user_id TEXT,
      access_level TEXT DEFAULT 'WRITE',
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      assigned_by TEXT,
      PRIMARY KEY (case_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      document_number TEXT NOT NULL UNIQUE,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      version TEXT DEFAULT 'v1',
      uploaded_by TEXT,
      security_classification TEXT DEFAULT 'CONFIDENTIAL',
      verification_status TEXT DEFAULT 'VERIFIED',
      signature_status TEXT DEFAULT 'VALID',
      digital_signature TEXT,
      ocr_extracted_text TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      version_number TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      file_path TEXT NOT NULL,
      change_summary TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      evidence_number TEXT NOT NULL UNIQUE,
      case_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      evidence_type TEXT NOT NULL,
      collected_by TEXT,
      collection_date TEXT NOT NULL,
      collection_location TEXT NOT NULL,
      storage_location TEXT NOT NULL,
      current_custodian_id TEXT,
      integrity_status TEXT DEFAULT 'SECURE',
      sha256_hash TEXT NOT NULL,
      digital_signature TEXT,
      serial_barcode TEXT,
      custody_state TEXT DEFAULT 'STORED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chain_of_custody (
      id TEXT PRIMARY KEY,
      evidence_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      from_officer_id TEXT,
      to_officer_id TEXT,
      from_department TEXT,
      to_department TEXT,
      transfer_reason TEXT,
      storage_location TEXT,
      digital_signature TEXT NOT NULL,
      sha256_verification TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      officer_id TEXT,
      officer_name TEXT,
      department TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      resource_name TEXT,
      endpoint TEXT,
      http_method TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      result TEXT NOT NULL,
      reason TEXT,
      request_id TEXT NOT NULL,
      checksum TEXT
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      description TEXT NOT NULL,
      source_ip TEXT,
      officer_id TEXT,
      resource_id TEXT,
      status TEXT DEFAULT 'OPEN'
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      priority TEXT DEFAULT 'NORMAL',
      resource_type TEXT,
      resource_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if data already exists
  const countRow = sqliteDb.prepare('SELECT count(*) as count FROM users').get();
  if (countRow.count === 0) {
    seedDatabase();
  }
}

/**
 * Seeds realistic government law enforcement data
 */
function seedDatabase() {
  console.log('Seeding CASEVAULT database with official NDIS demo data...');

  // 1. Departments
  const departments = [
    { id: 'dept-eiu', name: 'Economic Investigation Unit', code: 'EIU', jurisdiction: 'Financial & Corporate Fraud Jurisdiction (National)' },
    { id: 'dept-ccd', name: 'Cyber Crime Division', code: 'CCD', jurisdiction: 'Digital & Telecommunications Forensics (National)' },
    { id: 'dept-diu', name: 'District Investigation Unit', code: 'DIU', jurisdiction: 'Capital Region General & Field Crime' },
    { id: 'dept-fsd', name: 'Forensic Science Division', code: 'FSD', jurisdiction: 'Central Digital & Physical Forensics Laboratory' },
    { id: 'dept-lad', name: 'Legal Affairs Department', code: 'LAD', jurisdiction: 'Prosecution, Court Filings & Judicial Compliance' }
  ];

  const insertDept = sqliteDb.prepare('INSERT INTO departments (id, name, code, jurisdiction) VALUES (?, ?, ?, ?)');
  for (const d of departments) {
    insertDept.run(d.id, d.name, d.code, d.jurisdiction);
  }

  // 2. Roles
  const roles = [
    { id: 'role-admin', name: 'Administrator', description: 'System Administrator with platform oversight and security governance', hierarchy_level: 6 },
    { id: 'role-dh', name: 'Department Head', description: 'Division Chief with case delegation, approval and review authority', hierarchy_level: 5 },
    { id: 'role-io', name: 'Investigation Officer', description: 'Field and lead case officer with full investigation access', hierarchy_level: 4 },
    { id: 'role-fo', name: 'Forensic Officer', description: 'Evidence extraction, forensic document verification and laboratory vault', hierarchy_level: 3 },
    { id: 'role-lo', name: 'Legal Officer', description: 'Prosecution oversight, charge sheet preparation and court filings', hierarchy_level: 2 },
    { id: 'role-aud', name: 'Auditor', description: 'Vigilance & compliance officer with read-only inspection access', hierarchy_level: 1 }
  ];

  const insertRole = sqliteDb.prepare('INSERT INTO roles (id, name, description, hierarchy_level) VALUES (?, ?, ?, ?)');
  for (const r of roles) {
    insertRole.run(r.id, r.name, r.description, r.hierarchy_level);
  }

  // 3. Permissions
  const permissions = [
    { id: 'perm-view', code: 'VIEW', category: 'DATA', description: 'View cases, documents and evidence' },
    { id: 'perm-upload', code: 'UPLOAD', category: 'DOCUMENTS', description: 'Upload sensitive case documents' },
    { id: 'perm-download', code: 'DOWNLOAD', category: 'DOCUMENTS', description: 'Download decrypted case files' },
    { id: 'perm-edit', code: 'EDIT', category: 'CASES', description: 'Update case records and metadata' },
    { id: 'perm-share', code: 'SHARE', category: 'COLLABORATION', description: 'Share case files across departments' },
    { id: 'perm-verify', code: 'VERIFY', category: 'INTEGRITY', description: 'Perform SHA-256 integrity verification and sign' },
    { id: 'perm-audit', code: 'AUDIT', category: 'COMPLIANCE', description: 'Inspect system-wide immutable audit trail' },
    { id: 'perm-admin', code: 'ADMIN', category: 'SYSTEM', description: 'Manage users, access permissions and security' },
    { id: 'perm-transfer', code: 'TRANSFER', category: 'EVIDENCE', description: 'Initiate or accept evidence chain of custody' },
    { id: 'perm-create-case', code: 'CREATE_CASE', category: 'CASES', description: 'Register new formal investigation cases' }
  ];

  const insertPerm = sqliteDb.prepare('INSERT INTO permissions (id, code, category, description) VALUES (?, ?, ?, ?)');
  for (const p of permissions) {
    insertPerm.run(p.id, p.code, p.category, p.description);
  }

  // 4. Role Permissions
  const rolePermMap = {
    'role-admin': ['perm-view', 'perm-upload', 'perm-download', 'perm-edit', 'perm-share', 'perm-verify', 'perm-audit', 'perm-admin', 'perm-transfer', 'perm-create-case'],
    'role-dh': ['perm-view', 'perm-upload', 'perm-download', 'perm-edit', 'perm-share', 'perm-verify', 'perm-audit', 'perm-transfer', 'perm-create-case'],
    'role-io': ['perm-view', 'perm-upload', 'perm-download', 'perm-edit', 'perm-share', 'perm-verify', 'perm-audit', 'perm-admin', 'perm-transfer', 'perm-create-case'],
    'role-fo': ['perm-view', 'perm-upload', 'perm-download', 'perm-verify', 'perm-transfer'],
    'role-lo': ['perm-view', 'perm-download', 'perm-edit', 'perm-verify'],
    'role-aud': ['perm-view', 'perm-audit']
  };

  const insertRolePerm = sqliteDb.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  for (const [roleId, perms] of Object.entries(rolePermMap)) {
    for (const permId of perms) {
      insertRolePerm.run(roleId, permId);
    }
  }

  // 5. Users (Government Officers)
  const users = [
    {
      id: 'usr-sharma',
      officer_id: 'NDIS-IO-4102',
      full_name: 'A. Sharma',
      email: 'a.sharma@ndis.gov.in',
      password_hash: 'gov_pass_hash_sharma',
      department_id: 'dept-eiu',
      role_id: 'role-io',
      badge_number: 'NDIS-88214',
      designation: 'Lead Investigation Officer (EIU)',
      phone: '+91 98110 44210',
      last_login: '2026-09-23 13:42:15'
    },
    {
      id: 'usr-patel',
      officer_id: 'NDIS-FO-8819',
      full_name: 'R. Patel',
      email: 'r.patel@ndis.gov.in',
      password_hash: 'gov_pass_hash_patel',
      department_id: 'dept-fsd',
      role_id: 'role-fo',
      badge_number: 'NDIS-77402',
      designation: 'Senior Digital Forensic Specialist',
      phone: '+91 98220 11983',
      last_login: '2026-09-23 13:15:02'
    },
    {
      id: 'usr-singh',
      officer_id: 'NDIS-LO-3301',
      full_name: 'N. Singh',
      email: 'n.singh@ndis.gov.in',
      password_hash: 'gov_pass_hash_singh',
      department_id: 'dept-lad',
      role_id: 'role-lo',
      badge_number: 'NDIS-55109',
      designation: 'Senior Legal & Prosecution Officer',
      phone: '+91 98330 67201',
      last_login: '2026-09-23 12:50:33'
    },
    {
      id: 'usr-khan',
      officer_id: 'NDIS-IO-5520',
      full_name: 'S. Khan',
      email: 's.khan@ndis.gov.in',
      password_hash: 'gov_pass_hash_khan',
      department_id: 'dept-diu',
      role_id: 'role-io',
      badge_number: 'NDIS-66914',
      designation: 'Investigation Officer (DIU)',
      phone: '+91 98440 88319',
      last_login: '2026-09-23 11:22:45'
    },
    {
      id: 'usr-mehta',
      officer_id: 'NDIS-DH-1002',
      full_name: 'V. Mehta',
      email: 'v.mehta@ndis.gov.in',
      password_hash: 'gov_pass_hash_mehta',
      department_id: 'dept-eiu',
      role_id: 'role-dh',
      badge_number: 'NDIS-11002',
      designation: 'Joint Director & Department Head',
      phone: '+91 98550 22340',
      last_login: '2026-09-23 09:40:11'
    },
    {
      id: 'usr-deshmukh',
      officer_id: 'NDIS-CCD-7712',
      full_name: 'P. Deshmukh',
      email: 'p.deshmukh@ndis.gov.in',
      password_hash: 'gov_pass_hash_deshmukh',
      department_id: 'dept-ccd',
      role_id: 'role-io',
      badge_number: 'NDIS-33491',
      designation: 'Cyber Forensics Lead Officer',
      phone: '+91 98660 44921',
      last_login: '2026-09-23 13:05:22'
    },
    {
      id: 'usr-iyer',
      officer_id: 'NDIS-AUD-9904',
      full_name: 'K. Iyer',
      email: 'k.iyer@ndis.gov.in',
      password_hash: 'gov_pass_hash_iyer',
      department_id: 'dept-lad',
      role_id: 'role-aud',
      badge_number: 'NDIS-99104',
      designation: 'Chief Compliance & Vigilance Auditor',
      phone: '+91 98770 12834',
      last_login: '2026-09-23 10:18:49'
    },
    {
      id: 'usr-rajan',
      officer_id: 'NDIS-ADM-0001',
      full_name: 'S. Rajan',
      email: 's.rajan@ndis.gov.in',
      password_hash: 'gov_pass_hash_rajan',
      department_id: 'dept-ccd',
      role_id: 'role-admin',
      badge_number: 'NDIS-00001',
      designation: 'Chief Security Officer & Systems Admin',
      phone: '+91 98880 99011',
      last_login: '2026-09-23 08:30:00'
    }
  ];

  const insertUser = sqliteDb.prepare(`
    INSERT INTO users (id, officer_id, full_name, email, password_hash, department_id, role_id, badge_number, designation, phone, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of users) {
    insertUser.run(u.id, u.officer_id, u.full_name, u.email, u.password_hash, u.department_id, u.role_id, u.badge_number, u.designation, u.phone, u.last_login);
  }

  // 6. Cases (10 realistic government investigation cases)
  const cases = [
    {
      id: 'case-041',
      case_number: 'CASE-2026-041',
      title: 'Financial Fraud Investigation (Apex FinCorp Multi-Jurisdiction Shell Diversion)',
      case_type: 'Economic & Financial Crime',
      department_id: 'dept-eiu',
      jurisdiction: 'National Capital Region & Offshore Banking Hubs',
      lead_officer_id: 'usr-sharma',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      confidentiality_level: 'CONFIDENTIAL',
      description: 'Comprehensive investigation into multi-tier shell company networks used for routing unsecured credit through bogus export declarations and round-tripping foreign capital.',
      investigation_progress: 78,
      fir_number: 'FIR-EIU-2026-0041',
      acts_sections: 'IPC 420, 467, 471, PMLA Sec 3 & 4',
      date_opened: '2026-02-14'
    },
    {
      id: 'case-038',
      case_number: 'CASE-2026-038',
      title: 'Cyber Investigation (Critical Power Grid SCADA Ransomware Intrusion)',
      case_type: 'Cyber Terrorism & Intrusion',
      department_id: 'dept-ccd',
      jurisdiction: 'Northern Power Grid Control Centers',
      lead_officer_id: 'usr-patel',
      priority: 'CRITICAL',
      status: 'UNDER REVIEW',
      confidentiality_level: 'TOP SECRET',
      description: 'Sophisticated malware deployment detected targeting operational technology network segments of state power distributors with C2 traffic originating from compromised proxy nodes.',
      investigation_progress: 45,
      fir_number: 'FIR-CCD-2026-0038',
      acts_sections: 'IT Act 66F, 70B, IPC 121A',
      date_opened: '2026-03-01'
    },
    {
      id: 'case-031',
      case_number: 'CASE-2026-031',
      title: 'Missing Person Investigation (Disappearance of Senior Corporate Statutory Auditor)',
      case_type: 'Special Field Investigation',
      department_id: 'dept-diu',
      jurisdiction: 'District Central & Highway Checkposts',
      lead_officer_id: 'usr-khan',
      priority: 'HIGH',
      status: 'ACTIVE',
      confidentiality_level: 'CONFIDENTIAL',
      description: 'Inquiry into the sudden disappearance of statutory auditor 48 hours prior to the submission of a forensic audit report regarding an infrastructure conglomerate.',
      investigation_progress: 62,
      fir_number: 'FIR-DIU-2026-0031',
      acts_sections: 'IPC 365, 506, 120B',
      date_opened: '2026-03-10'
    },
    {
      id: 'case-029',
      case_number: 'CASE-2026-029',
      title: 'Cross-Border Counterfeit Currency & High-Quality Fake Bank Note Syndicate',
      case_type: 'Economic & Financial Crime',
      department_id: 'dept-eiu',
      jurisdiction: 'Eastern Transit Corridors',
      lead_officer_id: 'usr-sharma',
      priority: 'HIGH',
      status: 'ACTIVE',
      confidentiality_level: 'SECRET',
      description: 'Distribution network involved in printing and circulating high-quality counterfeit 500-denomination notes mimicking optically variable ink security threads.',
      investigation_progress: 85,
      fir_number: 'FIR-EIU-2026-0029',
      acts_sections: 'IPC 489A, 489B, 489C, UAPA 16',
      date_opened: '2026-01-20'
    },
    {
      id: 'case-025',
      case_number: 'CASE-2026-025',
      title: 'Defense Research Document Exfiltration & Espionage Telemetry Analysis',
      case_type: 'Cyber Espionage',
      department_id: 'dept-ccd',
      jurisdiction: 'Defense Technical Complexes',
      lead_officer_id: 'usr-deshmukh',
      priority: 'CRITICAL',
      status: 'ACTIVE',
      confidentiality_level: 'TOP SECRET',
      description: 'Investigation into advanced persistent threat (APT) spear-phishing campaign directed at aerospace propulsion research laboratories.',
      investigation_progress: 92,
      fir_number: 'FIR-CCD-2026-0025',
      acts_sections: 'Official Secrets Act 1923 Sec 3 & 5, IT Act 66',
      date_opened: '2026-01-08'
    },
    {
      id: 'case-019',
      case_number: 'CASE-2026-019',
      title: 'Public Procurement Kickback & E-Tendering Bid Rigging Investigation',
      case_type: 'Vigilance & Anti-Corruption',
      department_id: 'dept-eiu',
      jurisdiction: 'State Urban Infrastructure Board',
      lead_officer_id: 'usr-mehta',
      priority: 'MEDIUM',
      status: 'UNDER REVIEW',
      confidentiality_level: 'CONFIDENTIAL',
      description: 'Collusive bidding and hash-collision exploitation in municipal smart city cloud portal procurement tenders.',
      investigation_progress: 70,
      fir_number: 'FIR-EIU-2026-0019',
      acts_sections: 'Prevention of Corruption Act 7, 13(1)(d), IPC 420',
      date_opened: '2025-11-12'
    },
    {
      id: 'case-014',
      case_number: 'CASE-2026-014',
      title: 'High-Seas Contraband Interception & Maritime Channel Narcotics Trafficking',
      case_type: 'Field Enforcement',
      department_id: 'dept-diu',
      jurisdiction: 'Western Coastal Marine Police Jurisdiction',
      lead_officer_id: 'usr-khan',
      priority: 'HIGH',
      status: 'CLOSED',
      confidentiality_level: 'CONFIDENTIAL',
      description: 'Seizure of commercial unmanifested vessel carrying illicit substances with satellite communication logs verified.',
      investigation_progress: 100,
      fir_number: 'FIR-DIU-2026-0014',
      acts_sections: 'NDPS Act 8(c), 21, 29',
      date_opened: '2025-10-05',
      date_closed: '2026-02-28'
    },
    {
      id: 'case-011',
      case_number: 'CASE-2026-011',
      title: 'Digital Identity Theft & Illegal International SIM Box VoIP Terminal Operation',
      case_type: 'Telecommunications Fraud',
      department_id: 'dept-ccd',
      jurisdiction: 'Metro Telecommunications Hubs',
      lead_officer_id: 'usr-deshmukh',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      confidentiality_level: 'RESTRICTED',
      description: 'Operation of unauthorized gray telecom exchanges terminating international VoIP calls using forged SIM KYC records.',
      investigation_progress: 58,
      fir_number: 'FIR-CCD-2026-0011',
      acts_sections: 'Indian Telegraph Act 4, 20, 25, IT Act 66C',
      date_opened: '2026-02-01'
    },
    {
      id: 'case-008',
      case_number: 'CASE-2026-008',
      title: 'Essential Pharmaceuticals Supply Hoarding & Artificial Scarcity Conspiracy',
      case_type: 'Economic & Public Health',
      department_id: 'dept-diu',
      jurisdiction: 'Central Medical Warehouses & Distribution Logistics',
      lead_officer_id: 'usr-khan',
      priority: 'LOW',
      status: 'ACTIVE',
      confidentiality_level: 'CONFIDENTIAL',
      description: 'Syndicate diverting government subsidized emergency medications into unauthorized private supply chains.',
      investigation_progress: 88,
      fir_number: 'FIR-DIU-2026-0008',
      acts_sections: 'Essential Commodities Act Sec 3 & 7, IPC 409',
      date_opened: '2026-01-15'
    },
    {
      id: 'case-004',
      case_number: 'CASE-2026-004',
      title: 'Unauthorized Interception & Digital Wiretapping of Financial Regulatory Officers',
      case_type: 'State Security & Privacy',
      department_id: 'dept-lad',
      jurisdiction: 'Apex Court & Financial Ministry Quarters',
      lead_officer_id: 'usr-singh',
      priority: 'CRITICAL',
      status: 'UNDER REVIEW',
      confidentiality_level: 'TOP SECRET',
      description: 'Judicial review regarding unlawful surveillance hardware discovered installed in financial regulatory tribunal conference suites.',
      investigation_progress: 30,
      fir_number: 'FIR-LAD-2026-0004',
      acts_sections: 'IT Act 43, 66E, 72, Telegraph Act 26',
      date_opened: '2026-03-05'
    }
  ];

  const insertCase = sqliteDb.prepare(`
    INSERT INTO cases (id, case_number, title, case_type, department_id, jurisdiction, lead_officer_id, priority, status, confidentiality_level, description, investigation_progress, fir_number, acts_sections, date_opened, date_closed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of cases) {
    insertCase.run(c.id, c.case_number, c.title, c.case_type, c.department_id, c.jurisdiction, c.lead_officer_id, c.priority, c.status, c.confidentiality_level, c.description, c.investigation_progress, c.fir_number, c.acts_sections, c.date_opened, c.date_closed || null);
  }

  // 7. Case Members
  const insertCaseMember = sqliteDb.prepare('INSERT INTO case_members (case_id, user_id, access_level, assigned_by) VALUES (?, ?, ?, ?)');
  insertCaseMember.run('case-041', 'usr-sharma', 'ADMIN', 'usr-mehta');
  insertCaseMember.run('case-041', 'usr-patel', 'WRITE', 'usr-sharma');
  insertCaseMember.run('case-041', 'usr-singh', 'WRITE', 'usr-sharma');
  insertCaseMember.run('case-041', 'usr-mehta', 'SUPERVISOR', 'usr-mehta');
  insertCaseMember.run('case-041', 'usr-iyer', 'READ_ONLY', 'usr-rajan');

  insertCaseMember.run('case-038', 'usr-patel', 'ADMIN', 'usr-rajan');
  insertCaseMember.run('case-038', 'usr-deshmukh', 'WRITE', 'usr-patel');
  insertCaseMember.run('case-038', 'usr-singh', 'READ_ONLY', 'usr-patel');

  insertCaseMember.run('case-031', 'usr-khan', 'ADMIN', 'usr-mehta');
  insertCaseMember.run('case-031', 'usr-sharma', 'WRITE', 'usr-khan');

  // 8. Documents (40 Realistic Case Documents)
  const documents = [
    // Case 041 Documents
    {
      id: 'doc-001',
      document_number: 'DOC-2026-0041-01',
      case_id: 'case-041',
      title: 'First Information Report (FIR No. 41/2026)',
      document_type: 'FIR',
      file_name: 'FIR_2026_041.pdf',
      file_path: '/uploads/FIR_2026_041.pdf',
      file_size_bytes: 1420500,
      mime_type: 'application/pdf',
      sha256_hash: '8F7A91C2E6B4A3D09F1C88E23B19A075D4E6F891234567890ABCDEF123456789',
      version: 'v3',
      uploaded_by: 'usr-sharma',
      security_classification: 'CONFIDENTIAL',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'GOVERNMENT OF INDIA. FIRST INFORMATION REPORT. Police Station: EIU Central. Date: 14/02/2026. Under Sections: IPC 420, 467, 471, PMLA Sec 3 & 4. Complainant: Financial Intelligence Unit. Accused: Apex FinCorp Ltd, Directors Rajesh Verma, Sunita Rao. Allegations: Diversion of loan proceeds totaling Rs. 482 Crores via shell entities.'
    },
    {
      id: 'doc-002',
      document_number: 'DOC-2026-0041-02',
      case_id: 'case-041',
      title: 'Digital Forensic Inspection Report — Banking Server Disk Clone',
      document_type: 'Forensic Report',
      file_name: 'Forensic_Report.pdf',
      file_path: '/uploads/Forensic_Report.pdf',
      file_size_bytes: 3892100,
      mime_type: 'application/pdf',
      sha256_hash: '4A1B2C3D4E5F67890123456789ABCDEF0123456789ABCDEF4A1B2C3D4E5F6789',
      version: 'v2',
      uploaded_by: 'usr-patel',
      security_classification: 'SECRET',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'FORENSIC SCIENCE DIVISION. DIGITAL EVIDENCE EXAMINATION REPORT. Lab Ref: FSD-DL-2026-089. Evidence Item: 2TB NVMe SSD. Analysis: Physical bitstream clone verified using SHA-256. Found 1,429 deleted ledger entries restored from unallocated cluster space showing automated bulk RTGS transactions scheduled between 02:00 AM and 04:30 AM.'
    },
    {
      id: 'doc-003',
      document_number: 'DOC-2026-0041-03',
      case_id: 'case-041',
      title: 'Preliminary Charge Sheet Draft v2',
      document_type: 'Court Filing',
      file_name: 'ChargeSheet_v2.pdf',
      file_path: '/uploads/ChargeSheet_v2.pdf',
      file_size_bytes: 2540000,
      mime_type: 'application/pdf',
      sha256_hash: '9C8B7A6F5E4D3C2B1A0F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B',
      version: 'v2',
      uploaded_by: 'usr-singh',
      security_classification: 'CONFIDENTIAL',
      verification_status: 'UNDER REVIEW',
      signature_status: 'PENDING',
      ocr_extracted_text: 'IN THE SPECIAL COURT FOR ECONOMIC OFFENCES. Prosecution Complaint under Section 44 read with Section 45 of PMLA, 2002. Accused: M/s Apex FinCorp Limited, Rajesh Verma, Sunita Rao. Charge formulation in respect of scheduled offences under IPC sections.'
    },
    {
      id: 'doc-004',
      document_number: 'DOC-2026-0041-04',
      case_id: 'case-041',
      title: 'Bank Transaction Reconciliation Report (State Bank Consolidated Audit)',
      document_type: 'Financial Audit',
      file_name: 'Bank_Transaction_Report.pdf',
      file_path: '/uploads/Bank_Transaction_Report.pdf',
      file_size_bytes: 5120000,
      mime_type: 'application/pdf',
      sha256_hash: '1E2D3C4B5A6F7E8D9C0B1A2F3E4D5C6B7A8F9E0D1C2B3A4F5E6D7C8B9A0F1E2D',
      version: 'v1',
      uploaded_by: 'usr-sharma',
      security_classification: 'CONFIDENTIAL',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'BANK TRANSACTION AUDIT & TRAIL ANALYSIS. Account No: 39820019284. Bank: State Bank Apex Branch. Discovered 34 layered transfers to dummy vendors without corresponding GST e-way bills or customs bills of entry.'
    },
    {
      id: 'doc-005',
      document_number: 'DOC-2026-0041-05',
      case_id: 'case-041',
      title: 'Key Witness Deposition — Chief Accounts Officer (Statement u/s 161 CrPC)',
      document_type: 'Witness Statement',
      file_name: 'Witness_Statement_07.pdf',
      file_path: '/uploads/Witness_Statement_07.pdf',
      file_size_bytes: 980000,
      mime_type: 'application/pdf',
      sha256_hash: '7B8A9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B',
      version: 'v1',
      uploaded_by: 'usr-sharma',
      security_classification: 'SECRET',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'STATEMENT RECORDED UNDER SECTION 161 Cr.P.C. Witness: Shri V. K. Raman, former Head of Accounts. Confirms board meetings where offshore remittance instructions were verbally communicated by Managing Director Rajesh Verma with forged board resolutions.'
    },
    {
      id: 'doc-006',
      document_number: 'DOC-2026-0041-06',
      case_id: 'case-041',
      title: 'Judicial Search & Seizure Warrant (Order No. EIU-W-2026/09)',
      document_type: 'Court Order',
      file_name: 'Search_Warrant_EIU_09.pdf',
      file_path: '/uploads/Search_Warrant_EIU_09.pdf',
      file_size_bytes: 750000,
      mime_type: 'application/pdf',
      sha256_hash: '3D2C1B0A9F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C3B2A1F0E9D8C7B6A5F4E3D2C',
      version: 'v1',
      uploaded_by: 'usr-singh',
      security_classification: 'RESTRICTED',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'COURT OF CHIEF METROPOLITAN MAGISTRATE. Search Warrant under Section 93 Cr.P.C. Authorizing officers of Economic Investigation Unit to enter premises at Plot 44, Cyber Park, Gurugram, and seize electronic storage media, ledgers, and stamp dies.'
    },
    {
      id: 'doc-007',
      document_number: 'DOC-2026-0041-07',
      case_id: 'case-041',
      title: 'Chartered Accountant Forensic Verification Certificate',
      document_type: 'Forensic Report',
      file_name: 'Financial_Forensic_Report.pdf',
      file_path: '/uploads/Financial_Forensic_Report.pdf',
      file_size_bytes: 4210000,
      mime_type: 'application/pdf',
      sha256_hash: '6F5E4D3C2B1A0F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E',
      version: 'v2',
      uploaded_by: 'usr-patel',
      security_classification: 'CONFIDENTIAL',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'INDEPENDENT FORENSIC AUDIT OPINION. Analysis of 18 offshore correspondent accounts in Mauritius and Dubai. Total unexplained round-tripped funds detected: Rs 312.4 Crores.'
    },
    {
      id: 'doc-008',
      document_number: 'DOC-2026-0041-08',
      case_id: 'case-041',
      title: 'Call Detail Record (CDR) Telemetry Mapping & Tower Logs',
      document_type: 'Evidence Log',
      file_name: 'CDR_Analysis_Report.pdf',
      file_path: '/uploads/CDR_Analysis_Report.pdf',
      file_size_bytes: 1820000,
      mime_type: 'application/pdf',
      sha256_hash: 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2',
      version: 'v1',
      uploaded_by: 'usr-sharma',
      security_classification: 'SECRET',
      verification_status: 'VERIFIED',
      signature_status: 'VALID',
      ocr_extracted_text: 'TELECOM SERVICE PROVIDER LOGS. Cell tower triangulation reveals coordinated international calls on VoIP encrypted numbers between key accused 20 minutes prior to raid initiation.'
    }
  ];

  // Add 32 more realistic documents across the remaining cases to reach 40 documents
  const docTypes = ['FIR', 'Forensic Report', 'Court Filing', 'Witness Statement', 'Evidence Log', 'Technical Assessment', 'Medical Report', 'Seizure Memo'];
  const remainingCases = ['case-038', 'case-031', 'case-029', 'case-025', 'case-019', 'case-014', 'case-011', 'case-008', 'case-004'];
  const uploaderList = ['usr-sharma', 'usr-patel', 'usr-singh', 'usr-khan', 'usr-deshmukh', 'usr-mehta'];

  let docIndex = 9;
  for (let i = 0; i < 32; i++) {
    const assignedCase = remainingCases[i % remainingCases.length];
    const docType = docTypes[i % docTypes.length];
    const uploader = uploaderList[i % uploaderList.length];
    const docNum = `DOC-2026-00${String(docIndex).padStart(2, '0')}`;
    const hash = CryptoService.generateSha256(`NDIS-DOCUMENT-SEED-PAYLOAD-${docIndex}-${assignedCase}`);

    documents.push({
      id: `doc-${String(docIndex).padStart(3, '0')}`,
      document_number: docNum,
      case_id: assignedCase,
      title: `${docType} for Case Investigation Archive #${docIndex}`,
      document_type: docType,
      file_name: `${docType.replace(/\s+/g, '_')}_Archive_${docIndex}.pdf`,
      file_path: `/uploads/${docType.replace(/\s+/g, '_')}_Archive_${docIndex}.pdf`,
      file_size_bytes: 1024000 + (docIndex * 54321) % 4000000,
      mime_type: 'application/pdf',
      sha256_hash: hash,
      version: 'v1',
      uploaded_by: uploader,
      security_classification: docIndex % 3 === 0 ? 'SECRET' : 'CONFIDENTIAL',
      verification_status: docIndex % 5 === 0 ? 'UNDER REVIEW' : 'VERIFIED',
      signature_status: docIndex % 5 === 0 ? 'PENDING' : 'VALID',
      ocr_extracted_text: `Official records and forensic extraction ledger for ${assignedCase}. Digital integrity verified under Government IT standards. Signatory: Officer ${uploader}.`
    });
    docIndex++;
  }

  const insertDoc = sqliteDb.prepare(`
    INSERT INTO documents (id, document_number, case_id, title, document_type, file_name, file_path, file_size_bytes, mime_type, sha256_hash, version, uploaded_by, security_classification, verification_status, signature_status, digital_signature, ocr_extracted_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const doc of documents) {
    const sig = CryptoService.generateDigitalSignature(doc.uploaded_by, doc.sha256_hash);
    insertDoc.run(doc.id, doc.document_number, doc.case_id, doc.title, doc.document_type, doc.file_name, doc.file_path, doc.file_size_bytes, doc.mime_type, doc.sha256_hash, doc.version, doc.uploaded_by, doc.security_classification, doc.verification_status, doc.signature_status, sig, doc.ocr_extracted_text);
  }

  // 9. Evidence (15 Records with Full Chain of Custody)
  const evidenceItems = [
    {
      id: 'ev-001',
      evidence_number: 'EVD-2026-041-01',
      case_id: 'case-041',
      title: 'Seized Corporate Server Primary NVMe SSD (Samsung 980 Pro 2TB)',
      description: 'Extracted directly from rackmount server SRV-APEX-01 during search operation at head office. Contains primary SQL financial accounting databases and transaction audit dumps.',
      evidence_type: 'Digital Storage Media',
      collected_by: 'usr-sharma',
      collection_date: '2026-02-15',
      collection_location: 'Apex FinCorp HQ Server Room, Gurugram',
      storage_location: 'FSD Secure Evidence Vault - Locker 4B',
      current_custodian_id: 'usr-patel',
      integrity_status: 'SECURE',
      sha256_hash: '99F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C3B2A1F0E9D8C7B6A5F4E3D2C1B0A9F8',
      serial_barcode: 'S980P-2TB-NDIS-9821',
      custody_state: 'EXAMINED'
    },
    {
      id: 'ev-002',
      evidence_number: 'EVD-2026-041-02',
      case_id: 'case-041',
      title: 'Kingston IronKey D300S Hardware-Encrypted USB Drive (64GB)',
      description: 'Hardware encrypted flash drive recovered from personal briefcase of Director Rajesh Verma at airport terminal while attempting exit.',
      evidence_type: 'Encrypted Digital Media',
      collected_by: 'usr-sharma',
      collection_date: '2026-02-16',
      collection_location: 'Terminal 3 VIP Lounge, IGI Airport',
      storage_location: 'Central Vault Safe Box #12',
      current_custodian_id: 'usr-patel',
      integrity_status: 'SECURE',
      sha256_hash: '5E4D3C2B1A0F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D',
      serial_barcode: 'IKD300-64-NDIS-3312',
      custody_state: 'STORED'
    },
    {
      id: 'ev-003',
      evidence_number: 'EVD-2026-041-03',
      case_id: 'case-041',
      title: 'Physical Board Resolution Minute Book & Company Seal Stamp',
      description: 'Hardbound register containing hand-signed minutes of secret director assemblies and original brass embossing company seal used on forged letters of credit.',
      evidence_type: 'Physical Document & Seal',
      collected_by: 'usr-sharma',
      collection_date: '2026-02-15',
      collection_location: 'Apex FinCorp Secretarial Cabin',
      storage_location: 'EIU Physical Evidence Lockup Room 102',
      current_custodian_id: 'usr-sharma',
      integrity_status: 'SECURE',
      sha256_hash: 'A3B2C1D0F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D3C2',
      serial_barcode: 'REG-MIN-2026-0041',
      custody_state: 'STORED'
    },
    {
      id: 'ev-004',
      evidence_number: 'EVD-2026-038-01',
      case_id: 'case-038',
      title: 'Industrial SCADA Gateway Router Log Memory Dump (Cisco Catalyst IE3400)',
      description: 'Volatile RAM dump and flash configuration image extracted from breached substation RTU controller.',
      evidence_type: 'Network Telemetry & Memory Dump',
      collected_by: 'usr-patel',
      collection_date: '2026-03-02',
      collection_location: 'Northern Substation Sub-Segment 04',
      storage_location: 'CCD Cyber Vault Rack 2',
      current_custodian_id: 'usr-deshmukh',
      integrity_status: 'SECURE',
      sha256_hash: '7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D3C2B1A0F9E8D7C6B',
      serial_barcode: 'CISCO-IE34-DUMP-88',
      custody_state: 'EXAMINED'
    },
    {
      id: 'ev-005',
      evidence_number: 'EVD-2026-031-01',
      case_id: 'case-031',
      title: 'Apple iPhone 15 Pro Mobile Device (Target Officer Communication Device)',
      description: 'Personal communication handset recovered from roadside vehicle inspection. Subjected to Cellebrite UFED physical bitstream extraction.',
      evidence_type: 'Mobile Device',
      collected_by: 'usr-khan',
      collection_date: '2026-03-11',
      collection_location: 'Abandoned Sedan, NH-48 Km Stone 42',
      storage_location: 'FSD Secure Mobile Forensics Lab',
      current_custodian_id: 'usr-patel',
      integrity_status: 'SECURE',
      sha256_hash: 'B1A0F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4B3A2F1E0D9C8B7A6F5E4D3C2B1A0',
      serial_barcode: 'CELLEBRITE-UFED-IP15',
      custody_state: 'EXAMINED'
    }
  ];

  // Add 10 more evidence records across the rest of the cases
  const evTypes = ['Digital Storage Media', 'Encrypted Digital Media', 'CCTV Footage Optical Disc', 'Bank Server Hard Drive', 'SIM Card Extraction Kit', 'Physical Ledger Book'];
  const locations = ['FSD Evidence Vault A1', 'CCD Cyber Lockup', 'EIU Vault Room 3', 'DIU Regional Armory Safe', 'Central Evidence Depository'];

  for (let i = 6; i <= 15; i++) {
    const assignedCase = cases[(i - 1) % cases.length];
    const evType = evTypes[i % evTypes.length];
    const loc = locations[i % locations.length];
    const collector = users[i % users.length];
    const hash = CryptoService.generateSha256(`EVIDENCE-PAYLOAD-${i}-${assignedCase.id}`);

    evidenceItems.push({
      id: `ev-${String(i).padStart(3, '0')}`,
      evidence_number: `EVD-2026-${String(i).padStart(3, '0')}`,
      case_id: assignedCase.id,
      title: `${evType} — Exhibit #${i} (${assignedCase.case_number})`,
      description: `Physical and digital exhibit collected under proper legal protocol during execution of warrant in ${assignedCase.case_number}.`,
      evidence_type: evType,
      collected_by: collector.id,
      collection_date: '2026-02-18',
      collection_location: assignedCase.jurisdiction,
      storage_location: loc,
      current_custodian_id: collector.id,
      integrity_status: 'SECURE',
      sha256_hash: hash,
      serial_barcode: `NDIS-EXHIBIT-${i}-2026`,
      custody_state: 'STORED'
    });
  }

  const insertEvidence = sqliteDb.prepare(`
    INSERT INTO evidence (id, evidence_number, case_id, title, description, evidence_type, collected_by, collection_date, collection_location, storage_location, current_custodian_id, integrity_status, sha256_hash, digital_signature, serial_barcode, custody_state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ev of evidenceItems) {
    const sig = CryptoService.generateDigitalSignature(ev.collected_by, ev.sha256_hash);
    insertEvidence.run(ev.id, ev.evidence_number, ev.case_id, ev.title, ev.description, ev.evidence_type, ev.collected_by, ev.collection_date, ev.collection_location, ev.storage_location, ev.current_custodian_id, ev.integrity_status, ev.sha256_hash, sig, ev.serial_barcode, ev.custody_state);
  }

  // 10. Chain of Custody (5 Realistic Sequential Custody Hops for EVD-2026-041-01)
  const custodyHops = [
    {
      id: 'coc-001',
      evidence_id: 'ev-001',
      action_type: 'COLLECTED',
      from_officer_id: null,
      to_officer_id: 'usr-sharma',
      from_department: 'Search Premises (Apex HQ)',
      to_department: 'Economic Investigation Unit',
      transfer_reason: 'Physical seizure of server disk during search and seizure raid under Section 93 CrPC.',
      storage_location: 'Anti-Static Evidence Bag Seal #NDIS-8821',
      timestamp: '2026-02-15 11:30:00'
    },
    {
      id: 'coc-002',
      evidence_id: 'ev-001',
      action_type: 'TRANSFERRED',
      from_officer_id: 'usr-sharma',
      to_officer_id: 'usr-patel',
      from_department: 'Economic Investigation Unit',
      to_department: 'Forensic Science Division',
      transfer_reason: 'Requisition sent for bitstream imaging, write-blocked forensic examination, and recovery of purged ledgers.',
      storage_location: 'Transit Secure Transit Pouch',
      timestamp: '2026-02-15 15:45:00'
    },
    {
      id: 'coc-003',
      evidence_id: 'ev-001',
      action_type: 'RECEIVED',
      from_officer_id: 'usr-sharma',
      to_officer_id: 'usr-patel',
      from_department: 'Economic Investigation Unit',
      to_department: 'Forensic Science Division',
      transfer_reason: 'Received in sealed condition with anti-tamper barcode intact. Hash recalculated and verified matching seizure log.',
      storage_location: 'FSD Forensic Intake Locker #08',
      timestamp: '2026-02-15 16:30:00'
    },
    {
      id: 'coc-004',
      evidence_id: 'ev-001',
      action_type: 'EXAMINED',
      from_officer_id: 'usr-patel',
      to_officer_id: 'usr-patel',
      from_department: 'Forensic Science Division',
      to_department: 'Forensic Science Division',
      transfer_reason: 'Forensic write-blocked bitstream image successfully captured. Deleted SQLite transaction tables extracted and documented in Report FSD-DL-2026-089.',
      storage_location: 'Forensic Workstation Lab 2',
      timestamp: '2026-02-16 10:15:00'
    },
    {
      id: 'coc-005',
      evidence_id: 'ev-001',
      action_type: 'STORED',
      from_officer_id: 'usr-patel',
      to_officer_id: 'usr-patel',
      from_department: 'Forensic Science Division',
      to_department: 'Forensic Science Division',
      transfer_reason: 'Placed in climate-controlled Faraday cage evidence vault locker 4B awaiting court trial exhibit marking.',
      storage_location: 'FSD Secure Evidence Vault - Locker 4B',
      timestamp: '2026-02-16 17:00:00'
    }
  ];

  const insertCustody = sqliteDb.prepare(`
    INSERT INTO chain_of_custody (id, evidence_id, action_type, from_officer_id, to_officer_id, from_department, to_department, transfer_reason, storage_location, digital_signature, sha256_verification, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of custodyHops) {
    const sig = CryptoService.generateDigitalSignature(c.to_officer_id, '99F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C3B2A1F0E9D8C7B6A5F4E3D2C1B0A9F8');
    insertCustody.run(c.id, c.evidence_id, c.action_type, c.from_officer_id, c.to_officer_id, c.from_department, c.to_department, c.transfer_reason, c.storage_location, sig, '99F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C3B2A1F0E9D8C7B6A5F4E3D2C1B0A9F8', c.timestamp);
  }

  // 11. Audit Logs (100+ Immutable Realistic Records)
  console.log('Generating 100+ government audit events with cryptographic checksums...');
  const actions = [
    { action: 'LOGIN_SUCCESS', resType: 'AUTH', resId: 'AUTH-SES', resName: 'Officer Session Authentication', result: 'SUCCESS' },
    { action: 'DOCUMENT_VIEW', resType: 'DOCUMENT', resId: 'doc-001', resName: 'FIR_2026_041.pdf', result: 'SUCCESS' },
    { action: 'DOCUMENT_VERIFY', resType: 'DOCUMENT', resId: 'doc-002', resName: 'Forensic_Report.pdf', result: 'SUCCESS' },
    { action: 'DOCUMENT_DOWNLOAD', resType: 'DOCUMENT', resId: 'doc-004', resName: 'Bank_Transaction_Report.pdf', result: 'SUCCESS' },
    { action: 'DOCUMENT_DOWNLOAD', resType: 'DOCUMENT', resId: 'doc-001', resName: 'FIR_2026_041.pdf', result: 'DENIED', reason: 'Insufficient RBAC Clearance for Top Secret Tier' },
    { action: 'CASE_VIEW', resType: 'CASE', resId: 'case-041', resName: 'CASE-2026-041 Apex FinCorp Investigation', result: 'SUCCESS' },
    { action: 'EVIDENCE_TRANSFER', resType: 'EVIDENCE', resId: 'ev-001', resName: 'Samsung NVMe SSD 2TB', result: 'SUCCESS' },
    { action: 'EVIDENCE_VIEW', resType: 'EVIDENCE', resId: 'ev-002', resName: 'Kingston IronKey USB Drive', result: 'SUCCESS' },
    { action: 'SEARCH_QUERY', resType: 'AI_SEARCH', resId: 'SRCH-AI', resName: 'Query: Find financial evidence related to Case 041', result: 'SUCCESS' },
    { action: 'PERMISSION_CHECK', resType: 'RBAC', resId: 'PERM-01', resName: 'Permission Enforcement Check', result: 'SUCCESS' },
    { action: 'DOCUMENT_UPLOAD', resType: 'DOCUMENT', resId: 'doc-007', resName: 'Financial_Forensic_Report.pdf', result: 'SUCCESS' },
    { action: 'LOGIN_FAILED', resType: 'AUTH', resId: 'AUTH-FAIL', resName: 'Officer Session Authentication', result: 'DENIED', reason: 'Invalid Captcha or Password mismatch' }
  ];

  const insertAudit = sqliteDb.prepare(`
    INSERT INTO audit_logs (id, timestamp, user_id, officer_id, officer_name, department, action, resource_type, resource_id, resource_name, endpoint, http_method, ip_address, user_agent, result, reason, request_id, checksum)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const baseDate = new Date('2026-09-23T13:45:00Z').getTime();

  for (let i = 1; i <= 105; i++) {
    const user = users[i % users.length];
    const act = actions[i % actions.length];
    const timeOffsetMs = (105 - i) * 1000 * 60 * 18; // spaced over past 32 hours
    const logTime = new Date(baseDate - timeOffsetMs).toISOString().replace('T', ' ').substring(0, 19);
    const reqId = CryptoService.generateRequestId();
    const logId = `aud-${String(i).padStart(4, '0')}`;
    const ip = `10.42.${(i % 5) + 1}.${(i * 17) % 250 + 1}`;

    const logEntry = {
      timestamp: logTime,
      officer_id: user.officer_id,
      action: act.action,
      resource_id: act.resId,
      result: act.result,
      request_id: reqId
    };
    const checksum = CryptoService.generateAuditChecksum(logEntry);

    insertAudit.run(
      logId,
      logTime,
      user.id,
      user.officer_id,
      user.full_name,
      user.designation,
      act.action,
      act.resType,
      act.resId,
      act.resName,
      `/api/v1/${act.resType.toLowerCase()}`,
      act.action.includes('VIEW') || act.action.includes('QUERY') ? 'GET' : 'POST',
      ip,
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) NDIS-GovNet-SecureBrowser/3.4',
      act.result,
      act.reason || null,
      reqId,
      checksum
    );
  }

  // 12. Security Events
  const secEvents = [
    { id: 'sec-001', type: 'BRUTE_FORCE_ATTEMPT', severity: 'WARNING', desc: '5 failed login attempts detected within 45s from IP 192.168.10.45 targeting badge NDIS-88214. Progressive delay applied.', ip: '192.168.10.45', officer: 'NDIS-88214' },
    { id: 'sec-002', type: 'UNAUTHORIZED_ACCESS', severity: 'CRITICAL', desc: 'Unauthorized officer K. Iyer (Auditor - Read Only) attempted DELETE action on case file ChargeSheet_v2.pdf. Access blocked with 403 Forbidden.', ip: '10.42.2.14', officer: 'NDIS-AUD-9904' },
    { id: 'sec-003', type: 'INTEGRITY_MISMATCH', severity: 'CRITICAL', desc: 'Cryptographic SHA-256 mismatch detected during automated nocturnal checksum scan on document DOC-2026-0041-03. File isolated to quarantine quarantine_01.', ip: '127.0.0.1', officer: 'SYSTEM-SCAN' },
    { id: 'sec-004', type: 'RATE_LIMIT_EXCEEDED', severity: 'WARNING', desc: 'Endpoint /api/v1/search hit 65 requests/minute threshold from workstation 10.42.1.88. Rate limited with 429 Too Many Requests.', ip: '10.42.1.88', officer: 'NDIS-IO-4102' },
    { id: 'sec-005', type: 'MFA_VALIDATION_SUCCESS', severity: 'INFO', desc: 'Hardware FIDO2 Security Key MFA validation passed for Lead Officer A. Sharma.', ip: '10.42.1.10', officer: 'NDIS-IO-4102' },
    { id: 'sec-006', type: 'PERMISSION_ESCALATION_BLOCKED', severity: 'WARNING', desc: 'Direct parameter tampering attempt detected on /api/v1/users/permissions. Originating token revoked.', ip: '10.42.3.99', officer: 'NDIS-FO-8819' },
    { id: 'sec-007', type: 'CHAIN_OF_CUSTODY_SIGNED', severity: 'INFO', desc: 'Digital custody transfer executed with ECDSA-P256 hardware token signature for exhibit EVD-2026-041-01.', ip: '10.42.4.12', officer: 'NDIS-FO-8819' }
  ];

  const insertSec = sqliteDb.prepare(`
    INSERT INTO security_events (id, timestamp, event_type, severity, description, source_ip, officer_id, resource_id, status)
    VALUES (?, datetime('now', '-${Math.floor(Math.random() * 300)} minutes'), ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);
  for (const s of secEvents) {
    insertSec.run(s.id, s.type, s.severity, s.desc, s.ip, s.officer, s.type === 'UNAUTHORIZED_ACCESS' ? 'DOC-2026-0041-03' : 'EVD-2026-041-01');
  }

  // 13. Notifications
  const notifications = [
    { id: 'notif-001', userId: 'usr-sharma', title: 'Document Verification Pending', msg: 'ChargeSheet_v2.pdf in CASE-2026-041 requires senior legal verification.', type: 'WARNING', priority: 'HIGH', rType: 'DOCUMENT', rId: 'doc-003' },
    { id: 'notif-002', userId: 'usr-sharma', title: 'Forensic Report Successfully Verified', msg: 'Forensic_Report.pdf bitstream SHA-256 verified by R. Patel (FSD).', type: 'SUCCESS', priority: 'NORMAL', rType: 'DOCUMENT', rId: 'doc-002' },
    { id: 'notif-003', userId: 'usr-sharma', title: 'Unauthorized Access Attempt Blocked', msg: 'Blocked unauthorized download attempt on FIR_2026_041.pdf from outside legal jurisdiction.', type: 'CRITICAL', priority: 'URGENT', rType: 'SECURITY', rId: 'sec-002' },
    { id: 'notif-004', userId: 'usr-patel', title: 'New Evidence Transferred', msg: 'Evidence EVD-2026-041-01 transferred to your custody for forensic analysis.', type: 'INFO', priority: 'NORMAL', rType: 'EVIDENCE', rId: 'ev-001' }
  ];

  const insertNotif = sqliteDb.prepare(`
    INSERT INTO notifications (id, user_id, title, message, notification_type, priority, resource_type, resource_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const n of notifications) {
    insertNotif.run(n.id, n.userId, n.title, n.msg, n.type, n.priority, n.rType, n.rId);
  }

  console.log('CASEVAULT database successfully initialized and seeded with 10 cases, 40 docs, 15 evidence records, and 100+ audit logs.');
}

// Initialize on module load
initDb();

/**
 * Universal Database Query Wrapper
 */
const db = {
  get: (sql, params = []) => {
    try {
      const stmt = sqliteDb.prepare(sql);
      return stmt.get(...params);
    } catch (e) {
      console.error('Database get error:', e, sql, params);
      throw e;
    }
  },
  all: (sql, params = []) => {
    try {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    } catch (e) {
      console.error('Database all error:', e, sql, params);
      throw e;
    }
  },
  run: (sql, params = []) => {
    try {
      const stmt = sqliteDb.prepare(sql);
      return stmt.run(...params);
    } catch (e) {
      console.error('Database run error:', e, sql, params);
      throw e;
    }
  },
  exec: (sql) => {
    try {
      return sqliteDb.exec(sql);
    } catch (e) {
      console.error('Database exec error:', e);
      throw e;
    }
  }
};

module.exports = db;
