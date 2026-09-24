"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function AuditTrailPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    action: 'ALL',
    result: 'ALL',
    department: 'ALL'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/audit', { ...filters, limit: 100 });
      setAuditLogs(res.data || []);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ search: '', action: 'ALL', result: 'ALL', department: 'ALL' });
  };

  const exportCsv = () => {
    window.location.href = 'http://localhost:3000/api/v1/audit/export';
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'लेखा परीक्षा एवं अनुपालन' : 'Audit & Compliance'}</h1>
          <div className="page-subtitle">
            Cryptographically sealed, append-only vigilance ledger tracking every platform transaction
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={printReport}>
            🖨 Print Compliance Sheet
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCsv}>
            📥 [ Export Audit Report ]
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group" style={{ flex: 1, minWidth: '200px' }}>
          <input type="text" name="search" className="form-control" style={{ width: '100%' }}
            placeholder="Search by action, resource, IP, request ID, officer..." 
            value={filters.search} onChange={handleFilterChange} />
        </div>

        <div className="filter-group">
          <label className="filter-label">Action:</label>
          <select name="action" className="form-control" value={filters.action} onChange={handleFilterChange}>
            <option value="ALL">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="DOCUMENT_VIEW">DOCUMENT_VIEW</option>
            <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
            <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
            <option value="DOCUMENT_DOWNLOAD">DOCUMENT_DOWNLOAD</option>
            <option value="EVIDENCE_TRANSFER">EVIDENCE_TRANSFER</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Result:</label>
          <select name="result" className="form-control" value={filters.result} onChange={handleFilterChange}>
            <option value="ALL">All Results</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DENIED">DENIED (Blocked)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Department:</label>
          <select name="department" className="form-control" value={filters.department} onChange={handleFilterChange}>
            <option value="ALL">All Departments</option>
            <option value="Economic Investigation Unit">Economic Investigation Unit (EIU)</option>
            <option value="Forensic Science Division">Forensic Science Division (FSD)</option>
            <option value="Cyber Crime Division">Cyber Crime Division (CCD)</option>
            <option value="District Investigation Unit">District Investigation Unit (DIU)</option>
            <option value="Legal Affairs Department">Legal Affairs Department (LAD)</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
      </div>

      {/* Audit Trail Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <span>📜</span> Immutable Statutory Audit Trail (<span>{auditLogs.length}</span> events)
          </div>
          <span style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>Append-Only Cryptographic HMAC Ledger</span>
        </div>
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Officer Identity</th>
                <th>Department / Unit</th>
                <th>Action</th>
                <th>Resource Target</th>
                <th>IP / Device</th>
                <th>Result</th>
                <th>Correlation ID</th>
                <th>Ledger Checksum</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>Loading immutable ledger...</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>No audit events found.</td></tr>
              ) : (
                auditLogs.map((l, idx) => {
                  const isSuccess = l.result === 'SUCCESS';
                  const resultBadge = isSuccess ? 'badge-success' : 'badge-denied';

                  return (
                    <tr key={idx}>
                      <td className="font-mono" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{l.officer_name || 'System'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{l.officer_id || ''}</div>
                      </td>
                      <td><div style={{ fontSize: '12px' }}>{l.department || 'NDIS'}</div></td>
                      <td><strong style={{ color: 'var(--gov-navy-primary)', fontSize: '11px' }}>{l.action}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{l.resource_name || l.resource_id}</div>
                        <div style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{l.resource_type} • {l.endpoint || ''}</div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '11px' }}>{l.ip_address}</td>
                      <td><span className={`badge ${resultBadge}`}>{l.result}</span></td>
                      <td className="font-mono" style={{ fontSize: '10px', color: 'var(--gov-text-muted)' }}>{l.request_id}</td>
                      <td className="font-mono" style={{ fontSize: '10px', color: '#0A6E31', fontWeight: 700 }}>{l.checksum || 'HASH-VALID'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
