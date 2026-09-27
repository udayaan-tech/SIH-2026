"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';

export default function LoginPage() {
  const router = useRouter();
  const { language, switchToOfficer } = useAppState();
  
  const [officerId, setOfficerId] = useState('DL-4821');
  const [password, setPassword] = useState('password123');
  const [department, setDepartment] = useState('dept-eiu');
  const [captcha, setCaptcha] = useState('8H7K2');
  
  const [status, setStatus] = useState({ display: 'none', bg: '', color: '', border: '', html: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isHindi = language === 'HI';

  const quickFill = (oId: string, deptId: string) => {
    setOfficerId(oId);
    setDepartment(deptId);
  };

  const handleLogin = async (e: any) => {
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
        badge_id: officerId,
        password: password,
        department
      });

      await new Promise(r => setTimeout(r, 500));
      setStatus({
        display: 'block', bg: '#F0FFF4', color: '#22543D', border: '1px solid #C6F6D5',
        html: `<strong>SUCCESS:</strong> Access granted. Establishing encrypted session...`
      });

      switchToOfficer(res.data.officer.officer_id);

      setTimeout(() => {
        router.push('/');
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
    <div style={{ height: '100vh', width: '100vw', display: 'flex', backgroundColor: '#F8F9FA' }}>
      
      {/* Container simulating the floating card effect from the inspiration */}
      <div style={{
        margin: 'auto',
        width: '95%',
        maxWidth: '1400px',
        height: '90vh',
        backgroundColor: '#FFFFFF',
        borderRadius: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        display: 'flex',
        overflow: 'hidden'
      }}>
        
        {/* LEFT PANEL - Vibrant Orange Aesthetic */}
        <div style={{
          flex: '1',
          background: 'var(--gov-navy-dark)',
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle concentric circles background effect (updated to white for contrast) */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '600px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '400px',
            height: '400px',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }} />

          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '80px', zIndex: 1, fontWeight: '500' }}>
            Cryptographic evidence anchoring — secure vault solutions for you.
          </p>

          <h1 style={{ 
            color: '#FFFFFF', 
            fontSize: '56px', 
            fontWeight: '700', 
            lineHeight: '1.1',
            letterSpacing: '-1px',
            zIndex: 1,
            marginBottom: '40px',
            textShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            Secure<br/>your evidence
          </h1>

          {/* Redesigned Glassmorphic Mobile Mockup */}
          <div style={{
            margin: '0 auto',
            marginTop: 'auto',
            width: '290px',
            height: '420px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '40px 40px 0 0',
            border: '1.5px solid rgba(255,255,255,0.3)',
            borderBottom: 'none',
            zIndex: 1,
            padding: '24px',
            boxShadow: '0 -20px 50px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            {/* Dynamic Island / Notch */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '24px',
              backgroundColor: '#000',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 8px'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0f0', boxShadow: '0 0 5px #0f0' }}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase' }}>System Health</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }}></div>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }}></div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', 
              color: '#FFF', marginTop: '10px', fontWeight: '500',
              backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80' }}>✓</div> 
                WORM Storage
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80' }}>✓</div> 
                Blockchain Node Sync
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80' }}>✓</div> 
                AES-256 Encryption
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80' }}>✓</div> 
                ZKP Verifier
              </div>
            </div>

            {/* Glowing Activity Graph */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '80px', marginTop: 'auto', padding: '0 10px' }}>
              {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
                <div key={i} style={{ 
                  flex: 1, 
                  height: `${h}%`, 
                  backgroundColor: i === 3 ? 'var(--gov-saffron)' : 'rgba(255,255,255,0.15)', 
                  borderRadius: '4px',
                  boxShadow: i === 3 ? '0 0 15px rgba(234, 88, 12, 0.6)' : 'none'
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Clean White Form */}
        <div style={{
          flex: '1',
          padding: '40px 60px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '24px', height: '24px', 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, var(--gov-saffron), var(--gov-green))',
                boxShadow: '0 0 10px rgba(234, 88, 12, 0.4)'
              }} />
              <span style={{ fontSize: '20px', fontWeight: '600', letterSpacing: '-0.5px' }}>Sakshya Setu</span>
            </div>
          </div>

          {/* Form Area */}
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                {isHindi ? 'अधिकारी लॉगिन' : 'Authorized Access Only'}
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px' }}>
                {isHindi ? 'प्रणाली में प्रवेश करने के लिए अपने क्रेडेंशियल्स दर्ज करें' : 'Enter your credentials to access the secure vault'}
              </p>
            </div>

            <div style={{ display: status.display, backgroundColor: status.bg, color: status.color, border: status.border, padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '20px' }} dangerouslySetInnerHTML={{ __html: status.html }}></div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Badge ID / Officer Number <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <input
                  type="text"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="NDIS-IO-4102"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--gov-saffron)'}
                  onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Department / Division <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    backgroundColor: '#FFF'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--gov-saffron)'}
                  onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                >
                  <option value="dept-eiu">Evidence Integrity Unit (EIU)</option>
                  <option value="dept-fsl">Forensic Science Lab (FSL)</option>
                  <option value="dept-cbi">Central Bureau of Investigation</option>
                  <option value="dept-cyber">Cyber Crime Cell</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    Secure Password <span style={{ color: '#E53E3E' }}>*</span>
                  </label>
                  <a href="#" style={{ fontSize: '11px', color: 'var(--gov-saffron)', textDecoration: 'none', fontWeight: '500' }}>Reset Password?</a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--gov-saffron)'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Security Captcha <span style={{ color: '#E53E3E' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    flex: '1', 
                    backgroundColor: '#F1F5F9', 
                    border: '1px dashed #CBD5E1', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    letterSpacing: '4px',
                    fontWeight: 'bold',
                    color: '#334155',
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)'
                  }}>
                    8H7K2
                  </div>
                  <input
                    type="text"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    placeholder="Enter code"
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #E0E0E0',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--gov-saffron)'}
                    onBlur={(e) => e.target.style.borderColor = '#E0E0E0'}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '30px',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--gov-saffron), #c2410c)',
                  color: '#FFF',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isSubmitting ? 'Authenticating...' : (isHindi ? 'लॉगिन करें' : 'Authenticate & Login')}
              </button>
            </form>
            
            {/* Quick Demo Logins for Hackathon */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px', marginTop: '30px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
                Hackathon Demo Shortcuts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button type="button" onClick={() => quickFill('DL-4821', 'dept-eiu')} style={{ fontSize: '11px', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer', color: '#666' }}>
                  Lead Investigating Officer
                </button>
                <button type="button" onClick={() => quickFill('FSL-9012', 'dept-fsl')} style={{ fontSize: '11px', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer', color: '#666' }}>
                  Forensics Tech (FSL)
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: '12px', paddingTop: '40px' }}>
            <div>© 2024-2026 Sakshya Setu Inc.</div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="#" style={{ color: '#666', textDecoration: 'none' }}>Contact Us</a>
              <a href="#" style={{ color: '#666', textDecoration: 'none' }}>{isHindi ? 'Hindi' : 'English'} ⌄</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
