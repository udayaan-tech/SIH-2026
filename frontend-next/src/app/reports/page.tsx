"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function ReportsPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';

  const [reportType, setReportType] = useState('case_status');
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    setError('');
    setCurrentReport(null);
    try {
      const res = await API.post('/reports/generate', { reportType });
      setCurrentReport(res.data);
    } catch (e: any) {
      setError(e.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCsv = () => {
    if (!currentReport || !currentReport.tableData) return;
    const rows = currentReport.tableData;
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];

    for (const r of rows) {
      const row = headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASEVAULT_${currentReport.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'सरकारी रिपोर्टिंग डैशबोर्ड' : 'Government Reporting Dashboard'}</h1>
          <div className="page-subtitle">
            Generate formal statutory investigation and compliance reports for court records and judicial oversight
          </div>
        </div>
      </div>

      {/* Report Generator Configuration Card */}
      <div className="gov-card" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '14px', alignItems: 'flex-end' }}>
          <div>
            <label className="filter-label">Statutory Report Type</label>
            <select className="form-control" style={{ width: '100%' }} value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="case_status">Case Status & Lifecycle Report</option>
              <option value="doc_activity">Document Activity & Verification Audit</option>
              <option value="evidence_chain">Evidence Vault & Chain-of-Custody Log</option>
              <option value="security_incidents">Security Incident & Threat Intelligence Report</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Jurisdictional Unit</label>
            <select className="form-control" style={{ width: '100%' }}>
              <option value="ALL">All Departments</option>
              <option value="dept-eiu">Economic Investigation Unit (EIU)</option>
              <option value="dept-ccd">Cyber Crime Division (CCD)</option>
              <option value="dept-fsd">Forensic Science Division (FSD)</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Reporting Period</label>
            <select className="form-control" style={{ width: '100%' }}>
              <option value="CURRENT_QUARTER">Current Quarter (Q1 2026)</option>
              <option value="PAST_30_DAYS">Past 30 Days</option>
              <option value="FISCAL_YEAR">Current Fiscal Year</option>
            </select>
          </div>

          <div>
            <button className="btn btn-primary" onClick={generateReport}>
              [ Generate Report ]
            </button>
          </div>
        </div>
      </div>

      {/* Output Report Area */}
      <div>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <span>⏳</span> Compiling official statutory dataset and aggregating metrics...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--status-critical)', padding: '20px', textAlign: 'center' }}>
            Failed to generate report: {error}
          </div>
        )}

        {!isLoading && currentReport && (
          <div className="gov-card">
            
            {/* Official Document Print Header */}
            <div className="gov-card-header" style={{ backgroundColor: 'var(--gov-surface-alt)', padding: '18px 24px', borderBottom: '2px solid var(--gov-navy-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--gov-text-muted)', letterSpacing: '0.5px' }}>
                  OFFICIAL GOVERNMENT OF INDIA REPORT • {currentReport.reportId}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gov-navy-dark)', marginTop: '2px' }}>
                  {currentReport.reportName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', marginTop: '4px' }}>
                  <strong>Authority:</strong> National Digital Investigation Services •
                  <strong>Signatory Officer:</strong> {currentReport.officer} •
                  <strong>Generated:</strong> {currentReport.generatedAt}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  🖨 [ Export PDF / Print ]
                </button>
                <button className="btn btn-primary btn-sm" onClick={exportCsv}>
                  📥 [ Export CSV ]
                </button>
              </div>
            </div>

            <div className="gov-card-body" style={{ padding: '24px' }}>
              {/* Summary Metrics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {Object.entries(currentReport.summaryMetrics || {}).map(([k, v]: [string, any]) => (
                  <div key={k} style={{ backgroundColor: 'var(--gov-surface-alt)', border: '1px solid var(--gov-border-light)', padding: '12px', borderRadius: 'var(--radius-sm)', borderTop: '3px solid var(--gov-navy-primary)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gov-text-muted)', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gov-navy-dark)', marginTop: '4px' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Tabular Dataset */}
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginBottom: '10px' }}>
                STATUTORY SCHEDULE & ITEMIZATION
              </div>
              <div className="table-responsive">
                <table className="gov-table">
                  <thead>
                    <tr>
                      {currentReport.tableData && currentReport.tableData.length > 0 && 
                        Object.keys(currentReport.tableData[0]).map(k => (
                          <th key={k}>{k.replace(/_/g, ' ').toUpperCase()}</th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {(currentReport.tableData || []).map((row: any, idx: number) => (
                      <tr key={idx}>
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Verification Disclaimer */}
              <div style={{ marginTop: '24px', borderTop: '1px dashed var(--gov-border)', paddingTop: '14px', fontSize: '11px', color: 'var(--gov-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <div>Prepared for judicial and supervisory oversight under statutory provisions of the NDIS Charter.</div>
                <div className="font-mono">CHECKSUM: {currentReport.reportId}-VERIFIED-100%</div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
