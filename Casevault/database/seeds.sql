-- ==============================================================================
-- CASEVAULT — PostgreSQL Seeds
-- Reference seed data matching the prototype configuration
-- ==============================================================================

INSERT INTO departments (id, name, code, jurisdiction) VALUES
('dept-eiu', 'Economic Investigation Unit', 'EIU', 'Financial & Corporate Fraud Jurisdiction (National)'),
('dept-ccd', 'Cyber Crime Division', 'CCD', 'Digital & Telecommunications Forensics (National)'),
('dept-diu', 'District Investigation Unit', 'DIU', 'Capital Region General & Field Crime'),
('dept-fsd', 'Forensic Science Division', 'FSD', 'Central Digital & Physical Forensics Laboratory'),
('dept-lad', 'Legal Affairs Department', 'LAD', 'Prosecution, Court Filings & Judicial Compliance')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, description, hierarchy_level) VALUES
('role-admin', 'Administrator', 'System Administrator with platform oversight and security governance', 6),
('role-dh', 'Department Head', 'Division Chief with case delegation, approval and review authority', 5),
('role-io', 'Investigation Officer', 'Field and lead case officer with full investigation access', 4),
('role-fo', 'Forensic Officer', 'Evidence extraction, forensic document verification and laboratory vault', 3),
('role-lo', 'Legal Officer', 'Prosecution oversight, charge sheet preparation and court filings', 2),
('role-aud', 'Auditor', 'Vigilance & compliance officer with read-only inspection access', 1)
ON CONFLICT (id) DO NOTHING;
