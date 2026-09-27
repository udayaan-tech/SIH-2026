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
  const [showPassword, setShowPassword] = useState(false);
  
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
        badge_id: officerId,
        password: password,
        department
      });

      let finalBadgeId = res.data.badge_id || officerId;

      if (res.data.mfa_required) {
        setStatus(prev => ({ ...prev, html: `<strong>MFA TRIGGERED:</strong> Auto-verifying security OTP...` }));
        await new Promise(r => setTimeout(r, 400));
        const mfaRes = await API.post('/auth/mfa/verify', {
          session_token: res.data.session_token,
          badge_id: finalBadgeId,
          otp: res.data.demo_otp
        });
        
        // Save the JWT token for subsequent API requests
        if (mfaRes.data?.token) {
          localStorage.setItem('casevault_token', mfaRes.data.token);
        }
      }

      await new Promise(r => setTimeout(r, 500));
      setStatus({
        display: 'block', bg: '#F0FFF4', color: '#22543D', border: '1px solid #C6F6D5',
        html: `<strong>SUCCESS:</strong> Access granted. Establishing encrypted session...`
      });

      localStorage.setItem('casevault_officer_id', finalBadgeId);
      switchToOfficer(finalBadgeId);

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
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
      
      {/* Full Page HTML5 Video Background */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      >
        <source src="/ocean-bg.mp4" type="video/mp4" />
      </video>

      {/* Liquid Glass Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 1, 
        backdropFilter: 'blur(24px) saturate(180%)', 
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        boxShadow: 'inset 0 0 0 2000px rgba(255,255,255,0.05)'
      }}></div>

      <div style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '1100px', width: '100%', minHeight: '700px', backgroundColor: '#FFFFFF', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        
        {/* LEFT: Login Form */}
        <div style={{ padding: '40px 60px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--gov-navy-dark)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <i className="fa-solid fa-building-columns" style={{ fontSize: '14px' }}></i>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gov-navy-dark)', letterSpacing: '0.5px' }}>
              Sakshya Setu
            </span>
          </div>

          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Welcome Back</h1>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>
              {isHindi ? 'अधिकारी लॉगिन पोर्टल में आपका स्वागत है' : 'Enter your designated credentials to access your account.'}
            </p>
          </div>

          <div style={{ display: status.display, padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontWeight: 600, backgroundColor: status.bg, color: status.color, border: status.border }} dangerouslySetInnerHTML={{ __html: status.html }}></div>

          <form onSubmit={handleLogin} style={{ flex: 1 }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Officer ID / Badge</label>
              <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }} value={officerId} onChange={e => setOfficerId(e.target.value)} required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }} value={password} onChange={e => setPassword(e.target.value)} required />
                <i className={`fa-regular ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', cursor: 'pointer' }}></i>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Department</label>
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', backgroundColor: '#FFF' }} value={department} onChange={e => setDepartment(e.target.value)}>
                  <option value="dept-eiu">EIU</option>
                  <option value="dept-ccd">CCD</option>
                  <option value="dept-fsd">FSD</option>
                  <option value="dept-diu">DIU</option>
                  <option value="dept-lad">LAD</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Captcha (8H7K2)</label>
                <input type="text" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none', textTransform: 'uppercase' }} value={captcha} onChange={e => setCaptcha(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4B5563', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid #D1D5DB' }} />
                Remember Me
              </label>
              <a href="#" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gov-navy-primary)', textDecoration: 'none' }}>Forgot Your Password?</a>
            </div>

            <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: 'var(--gov-navy-primary)', color: '#FFF', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)' }}>
              Log In
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: '#9CA3AF', fontSize: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
              <span style={{ padding: '0 12px' }}>Or Quick Login With</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button type="button" onClick={() => quickFill('DL-4821', 'dept-eiu')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <i className="fa-solid fa-user-shield" style={{ color: 'var(--gov-navy-primary)' }}></i> Lead IO
              </button>
              <button type="button" onClick={() => quickFill('FSL-9012', 'dept-fsd')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                <i className="fa-solid fa-microscope" style={{ color: 'var(--gov-saffron)' }}></i> Forensics
              </button>
            </div>
            
          </form>

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9CA3AF', paddingTop: '20px' }}>
            <span>Copyright © 2026 NDIS Govt. of India</span>
            <a href="#" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Privacy Policy</a>
          </div>

        </div>

        {/* RIGHT: Feature Showcase */}
        <div style={{ padding: '20px' }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--gov-navy-primary)', borderRadius: '20px', padding: '40px', color: '#FFF', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            
            {/* Background pattern circles */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>
            <div style={{ position: 'absolute', bottom: '-100px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

            <div style={{ position: 'relative', zIndex: 10 }}>
              <h2 style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1.3, marginBottom: '16px', maxWidth: '300px' }}>
                Effortlessly manage your cases and evidence.
              </h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '40px' }}>
                Log in to access your Sakshya Setu dashboard and manage your operations.
              </p>

              {/* Dashboard Mockup */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', width: '120%', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  
                  {/* Mini Card 1 */}
                  <div style={{ backgroundColor: 'var(--gov-navy-dark)', borderRadius: '8px', padding: '12px', flex: 1, color: '#FFF' }}>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Active Cases</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>2,374</div>
                    <div style={{ fontSize: '9px', color: '#10B981', marginTop: '4px' }}><i className="fa-solid fa-arrow-up"></i> 12% this month</div>
                  </div>
                  
                  {/* Mini Card 2 */}
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', flex: 1 }}>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>Evidence Registered</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>15,684</div>
                    <div style={{ height: '24px', display: 'flex', alignItems: 'flex-end', gap: '2px', marginTop: '8px' }}>
                      {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                        <div key={i} style={{ width: '4px', height: `${h}%`, backgroundColor: i === 5 ? 'var(--gov-navy-primary)' : '#CBD5E1', borderRadius: '2px' }}></div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Table Mockup */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>Recent Activity</div>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: i === 1 ? '#F59E0B' : '#10B981' }}></div>
                        <span style={{ color: '#475569' }}>C-2026-{4000+i}</span>
                      </div>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>Update Status</span>
                      <span style={{ color: '#94A3B8' }}>{10+i} Feb, 2026</span>
                    </div>
                  ))}
                </div>

                {/* Overlapping floating card */}
                <div style={{ position: 'absolute', right: '40px', top: '120px', width: '160px', backgroundColor: '#FFF', borderRadius: '12px', padding: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#0F172A', marginBottom: '12px', textAlign: 'center' }}>Case Categories</div>
                  {/* Donut chart mockup */}
                  <div style={{ width: '80px', height: '40px', borderTopLeftRadius: '40px', borderTopRightRadius: '40px', border: '16px solid var(--gov-navy-primary)', borderBottom: 'none', margin: '0 auto' }}></div>
                  <div style={{ textAlign: 'center', marginTop: '-10px', fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>6,248</div>
                  <div style={{ textAlign: 'center', fontSize: '9px', color: '#64748B' }}>Total Units</div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
