"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function CasesPage() {
  const router = useRouter();
  const { language } = useAppState();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [department, setDepartment] = useState('ALL');
  const [priority, setPriority] = useState('ALL');

  const isHindi = language === 'HI';

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await API.get(`/cases?search=${encodeURIComponent(search)}&status=${status}&department=${department}&priority=${priority}`);
      setCases(res.data || []);
    } catch (e) {
      console.error('Error fetching cases:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    fetchCases();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setDepartment('ALL');
    setPriority('ALL');
    // Using setTimeout to wait for state updates before fetching
    setTimeout(fetchCases, 0);
  };

  const exportCasesCsv = () => {
    const headers = ['Case ID', 'Case Title', 'Case Type', 'Department', 'Lead Officer', 'Priority', 'Status', 'Date Opened'];
    const rows = cases.map(c => [
      `"${c.case_number}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.case_type}"`,
      `"${c.department_name}"`,
      `"${c.lead_officer_name}"`,
      `"${c.priority}"`,
      `"${c.status}"`,
      `"${c.date_opened || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASEVAULT_Case_Registry_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'मामला प्रबंधन प्रणाली' : 'Case Management'}</h1>
          <div className="page-subtitle">
            Statutory investigation registers and cross-jurisdictional proceedings
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={exportCasesCsv}>
            <i className="fa-solid fa-download" style={{ marginRight: '6px' }}></i> Export Report
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/cases/new')}>
            <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Create New Case
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group" style={{ flex: 1, minWidth: '220px' }}>
          <input type="text" className="form-control" style={{ width: '100%' }}
            placeholder="Search by Case ID, Title, FIR number, or acts..." 
            value={search} onChange={e => { setSearch(e.target.value); setTimeout(fetchCases, 0); }} />
        </div>

        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <select className="form-control" value={status} onChange={e => { setStatus(e.target.value); setTimeout(fetchCases, 0); }}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="UNDER REVIEW">UNDER REVIEW</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Department:</label>
          <select className="form-control" value={department} onChange={e => { setDepartment(e.target.value); setTimeout(fetchCases, 0); }}>
            <option value="ALL">All Units</option>
            <option value="EIU">Economic Investigation Unit (EIU)</option>
            <option value="CCD">Cyber Crime Division (CCD)</option>
            <option value="DIU">District Investigation Unit (DIU)</option>
            <option value="FSD">Forensic Science Division (FSD)</option>
            <option value="LAD">Legal Affairs Department (LAD)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Priority:</label>
          <select className="form-control" value={priority} onChange={e => { setPriority(e.target.value); setTimeout(fetchCases, 0); }}>
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset</button>
      </div>

      {/* Cases Data Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <i className="fa-solid fa-scale-balanced" style={{ color: 'var(--gov-navy-light)' }}></i> Registered Government Investigation Cases (<span id="cases-count-badge">{cases.length}</span>)
          </div>
        </div>
        <div className="table-responsive">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Case Title</th>
                <th>Department</th>
                <th>Lead Officer</th>
                <th>Documents</th>
                <th>Evidence</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px' }}>Loading cases from official database...</td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--gov-text-muted)' }}>
                  No registered investigation records match the selected filter criteria.
                </td></tr>
              ) : (
                cases.map(c => {
                  let statusBadge = 'badge-active';
                  if (c.status === 'UNDER REVIEW') statusBadge = 'badge-review';
                  if (c.status === 'CLOSED') statusBadge = 'badge-closed';

                  let priorityColor = 'var(--gov-text-muted)';
                  if (c.priority === 'CRITICAL') priorityColor = 'var(--status-critical)';
                  if (c.priority === 'HIGH') priorityColor = 'var(--gov-saffron)';

                  return (
                    <tr key={c.id}>
                      <td><strong className="font-mono" style={{ color: 'var(--gov-navy-primary)', fontSize: '13px' }}>{c.case_number}</strong></td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--gov-navy-dark)' }}>{c.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                          {c.case_type} • <span style={{ color: priorityColor, fontWeight: 700 }}>{c.priority}</span> • {c.fir_number || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.department_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{c.jurisdiction}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.lead_officer_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--gov-text-muted)' }}>{c.lead_officer_code || ''}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-info">{c.document_count || 0}</span></td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-info">{c.evidence_count || 0}</span></td>
                      <td><span className={`badge ${statusBadge}`}>{c.status}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--gov-text-muted)' }}>{c.created_at ? c.created_at.substring(0, 10) : '2026-02-14'}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/cases/${c.id}`)}>
                          Open Workspace <i className="fa-solid fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                        </button>
                      </td>
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
