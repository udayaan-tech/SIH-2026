"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function LoginPage() {
  const router = useRouter();
  const { language, switchToOfficer } = useAppState();
  
  const [officerId, setOfficerId] = useState('NDIS-IO-4102');
  const [password, setPassword] = useState('••••••••••••');
  const [department, setDepartment] = useState('dept-eiu');
  const [captcha, setCaptcha] = useState('8H7K2');
  
  const [status, setStatus] = useState({ display: 'none', bg: '', color: '', border: '', html: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHindi = language === 'HI';

  const quickFill = (oId, deptId) => {
    setOfficerId(oId);
    setDepartment(deptId);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({
      display: 'block', bg: '#EBF8FF', color: '#2B6CB0', border: '1px solid #BEE3F8',
      html: `<strong>AUTHENTICATION IN PROGRESS:</strong> Authenticating Officer ${officerId}...`
    });

    await new Promise(r => setTimeout(r, 600));
    setStatus(prev => ({ ...prev, html: `<strong>SECURITY CHECK:</strong> Verifying credentials & MFA clearance...` }));

    try {
      const res = await API.post('/auth/login', {
        officerId,
        password: 'password_mock',
        department
      });

      await new Promise(r => setTimeout(r, 500));
      setStatus({
        display: 'block', bg: '#F0FFF4', color: '#22543D', border: '1px solid #C6F6D5',
        html: `<strong>SUCCESS:</strong> Access granted. Establishing encrypted session...`
      });

      switchToOfficer(res.data.officer.officer_id);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      setStatus({
        display: 'block', bg: '#FFF5F5', color: '#9B2C2C', border: '1px solid #FED7D7',
        html: `<strong>AUTHENTICATION FAILED:</strong> Invalid credentials or authorization temporarily unavailable.`
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '32px', maxWidth: '980px', width: '100%', backgroundColor: '#FFFFFF', border: '1px solid var(--gov-border)', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        
        {/* LEFT: Government Branding & Security Assurance */}
        <div style={{ backgroundColor: '#0E1D31', color: '#FFFFFF', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '3px solid var(--gov-saffron)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div className="gov-emblem-placeholder" style={{ width: '48px', height: '48px' }}>
                <i className="fa-solid fa-building-columns gov-emblem-icon"></i>
                <span className="gov-emblem-text">GOV</span>
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#94A3B8' }}>Government of India</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>National Digital Investigation Services</div>
              </div>
            </div>

            <div style={{ margin: '32px 0' }}>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--gov-saffron)', color: '#FFF', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
                SECURE DIGITAL REPOSITORY
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: '8px' }}>
                CASEVAULT
              </h1>
              <p style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                Secure Digital Case & Document Management System
              </p>
              <div style={{ borderLeft: '3px solid var(--gov-saffron)', paddingLeft: '12px', color: '#E2E8F0', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.5 }}>
                "Secure Every Document. Trace Every Action. Protect Every Case."
              </div>
            </div>

            {/* Security Indicators */}
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', padding: '14px', marginTop: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38BDF8', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Defense-in-Depth Security Protocol
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#CBD5E1' }}>
                <div><i className="fa-solid fa-check"></i> Strict Zero-Trust Role-Based Access Control (RBAC)</div>
                <div><i className="fa-solid fa-check"></i> Cryptographic SHA-256 Document Integrity Ledger</div>
                <div><i className="fa-solid fa-check"></i> Multi-Factor Hardware Authentication Ready</div>
                <div><i className="fa-solid fa-check"></i> Tamper-Evident Immutable Audit Logging</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', fontSize: '11px', color: '#64748B' }}>
            <strong>WARNING:</strong> Authorized Government Personnel Only. Unauthorized access attempts are monitored, blocked, and prosecuted under the Information Technology Act.
          </div>
        </div>

        {/* RIGHT: Login Form */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gov-navy-dark)' }}>
              {isHindi ? 'अधिकारी लॉगिन पोर्टल' : 'Officer Authentication Portal'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--gov-text-muted)', marginTop: '2px' }}>
              Enter your designated government credentials to establish a secure session.
            </p>
          </div>

          <div style={{ display: status.display, padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '12px', fontWeight: 600, backgroundColor: status.bg, color: status.color, border: status.border }} dangerouslySetInnerHTML={{ __html: status.html }}></div>

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginBottom: '4px' }}>
                Officer ID / Badge Number
              </label>
              <input type="text" className="form-control" style={{ width: '100%' }} value={officerId} onChange={e => setOfficerId(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginBottom: '4px' }}>
                Password / PIN
              </label>
              <input type="password" className="form-control" style={{ width: '100%' }} value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginBottom: '4px' }}>
                Department Jurisdiction
              </label>
              <select className="form-control" style={{ width: '100%' }} value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="dept-eiu">Economic Investigation Unit (EIU)</option>
                <option value="dept-ccd">Cyber Crime Division (CCD)</option>
                <option value="dept-fsd">Forensic Science Division (FSD)</option>
                <option value="dept-diu">District Investigation Unit (DIU)</option>
                <option value="dept-lad">Legal Affairs Department (LAD)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginBottom: '4px' }}>
                Security Captcha
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#E2E8F0', border: '1px solid var(--gov-border)', padding: '6px 14px', fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, letterSpacing: '4px', color: 'var(--gov-navy-dark)', userSelect: 'none' }}>
                  8 H 7 K 2
                </div>
                <input type="text" className="form-control" style={{ width: '100px', textTransform: 'uppercase' }} value={captcha} onChange={e => setCaptcha(e.target.value)} required />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => alert('Captcha refreshed')}><i className="fa-solid fa-rotate-right"></i></button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '10px' }} disabled={isSubmitting}>
                [ LOGIN ]
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => alert('Password reset instructions sent to official NDIS registered email.')}>
                [ Reset Password ]
              </button>
            </div>
          </form>

          <div style={{ borderTop: '1px dashed var(--gov-border)', paddingTop: '14px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)', marginBottom: '8px' }}>
              <i className="fa-solid fa-bolt" style={{ color: 'var(--gov-saffron)' }}></i> Fast Demo Persona Login (Click to switch):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => quickFill('NDIS-IO-4102', 'dept-eiu')}>
                Lead IO (A. Sharma)
              </button>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => quickFill('NDIS-FO-8819', 'dept-fsd')}>
                Forensic Officer (R. Patel)
              </button>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => quickFill('NDIS-AUD-9904', 'dept-lad')}>
                Auditor (K. Iyer)
              </button>
              <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => quickFill('NDIS-ADM-0001', 'dept-ccd')}>
                Admin (S. Rajan)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
