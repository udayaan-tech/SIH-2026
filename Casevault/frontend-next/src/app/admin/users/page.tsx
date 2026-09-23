"use client";

import React, { useState } from 'react';

export default function AdminUsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>User & Badge Management</h1>
          <div className="page-subtitle">Manage officer accounts, PKI badges, and access levels</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
            + Create New User
          </button>
        </div>
      </div>

      <div className="gov-card" style={{ marginBottom: '20px' }}>
        <div className="gov-card-header">
          <div className="gov-card-title">Registered Personnel</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" className="form-control" placeholder="Search by name, ID, or rank..." style={{ width: '250px', fontSize: '13px' }} />
            <select className="form-control" style={{ fontSize: '13px' }}>
              <option>All Jurisdictions</option>
              <option>Delhi Police HQ</option>
              <option>CBI HQ</option>
              <option>FSL Rohini</option>
            </select>
          </div>
        </div>
        
        <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
          <thead>
            <tr>
              <th>Officer ID / Badge</th>
              <th>Full Name & Rank</th>
              <th>Jurisdiction</th>
              <th>Role Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-mono">NDIS-IO-4102</td>
              <td><strong>Rajesh Sharma</strong><br/><span style={{ color: 'var(--gov-text-muted)', fontSize: '11px' }}>Sub-Inspector</span></td>
              <td>Delhi Police (Central)</td>
              <td>Investigating Officer (L2)</td>
              <td><span className="badge badge-verified">Active</span></td>
              <td><button className="btn btn-secondary btn-sm">Edit</button> <button className="btn btn-sm" style={{ color: 'red', borderColor: 'red' }}>Revoke</button></td>
            </tr>
            <tr>
              <td className="font-mono">NDIS-FSL-88</td>
              <td><strong>Dr. Meera Verma</strong><br/><span style={{ color: 'var(--gov-text-muted)', fontSize: '11px' }}>Senior Forensic Analyst</span></td>
              <td>FSL Rohini</td>
              <td>Forensic Analyst (L3)</td>
              <td><span className="badge badge-verified">Active</span></td>
              <td><button className="btn btn-secondary btn-sm">Edit</button> <button className="btn btn-sm" style={{ color: 'red', borderColor: 'red' }}>Revoke</button></td>
            </tr>
            <tr>
              <td className="font-mono">NDIS-PP-105</td>
              <td><strong>Arjun Reddy</strong><br/><span style={{ color: 'var(--gov-text-muted)', fontSize: '11px' }}>Public Prosecutor</span></td>
              <td>Delhi High Court</td>
              <td>Prosecutor (L4)</td>
              <td><span className="badge badge-verified">Active</span></td>
              <td><button className="btn btn-secondary btn-sm">Edit</button> <button className="btn btn-sm" style={{ color: 'red', borderColor: 'red' }}>Revoke</button></td>
            </tr>
            <tr>
              <td className="font-mono">NDIS-CBI-04</td>
              <td><strong>Vikram Singh</strong><br/><span style={{ color: 'var(--gov-text-muted)', fontSize: '11px' }}>Joint Director</span></td>
              <td>CBI HQ</td>
              <td>Supervisory (L5)</td>
              <td><span className="badge badge-verified">Active</span></td>
              <td><button className="btn btn-secondary btn-sm">Edit</button> <button className="btn btn-sm" style={{ color: 'red', borderColor: 'red' }}>Revoke</button></td>
            </tr>
            <tr style={{ opacity: 0.6, backgroundColor: '#F8FAFC' }}>
              <td className="font-mono">NDIS-IO-3392</td>
              <td><strong>Karan Patel</strong><br/><span style={{ color: 'var(--gov-text-muted)', fontSize: '11px' }}>Constable</span></td>
              <td>Delhi Police (East)</td>
              <td>Patrol (L1)</td>
              <td><span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#64748B' }}>Suspended</span></td>
              <td><button className="btn btn-secondary btn-sm">Re-issue</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Create User Modal Placeholder */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="gov-card" style={{ width: '500px', background: '#fff' }}>
            <div className="gov-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="gov-card-title">Provision New Officer</div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="gov-card-body">
              <div style={{ marginBottom: '12px' }}>
                <label className="filter-label">Full Name</label>
                <input type="text" className="form-control" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="filter-label">Rank / Designation</label>
                <input type="text" className="form-control" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="filter-label">Jurisdiction</label>
                <input type="text" className="form-control" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label className="filter-label">Access Level</label>
                <select className="form-control">
                  <option>L1 - View Public/Unclassified</option>
                  <option>L2 - Investigating Officer (Upload/Edit)</option>
                  <option>L3 - Forensic Analyst</option>
                  <option>L4 - Prosecutor</option>
                  <option>L5 - Supervisor/Judge</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="filter-label">Biometric Auth Registration</label>
                <div style={{ padding: '12px', background: '#E2E8F0', borderRadius: '4px', textAlign: 'center', color: 'var(--gov-text-muted)', fontSize: '13px' }}>
                  Connect NDIS Fingerprint Scanner to provision PKI token.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => { alert('User provisioned. PKI Token Generated.'); setIsModalOpen(false); }}>Provision Badge</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
