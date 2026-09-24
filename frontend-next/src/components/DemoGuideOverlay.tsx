"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoGuideOverlay() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '1. Secure Authentication',
      desc: 'Start by logging in using the smart card/badge credentials. Notice the NDIS ecosystem.',
      action: () => router.push('/login')
    },
    {
      title: '2. Officer Dashboard',
      desc: 'The main dashboard provides an overview of open cases, integrity alerts, and blockchain network status.',
      action: () => router.push('/')
    },
    {
      title: '3. Register a New FIR (POCSO)',
      desc: 'Let us register a new case. If the legal sections include POCSO or Section 64/65, the system automatically flags it for privacy.',
      action: () => router.push('/cases/new')
    },
    {
      title: '4. Secure Evidence Upload',
      desc: 'Now, upload CCTV evidence. Watch the 6-stage cryptographic pipeline: SHA-256 hash, Malware scan, AES-256 encryption, and Merkle tree append.',
      action: () => router.push('/documents') // Would ideally open upload modal here
    },
    {
      title: '5. Anti-Leak Document Viewer',
      desc: 'Evidence is rendered on an HTML5 canvas to prevent DOM-scraping. Notice the diagonal forensic watermark and the live Merkle Proof in the sidebar.',
      action: () => router.push('/documents/doc-001')
    },
    {
      title: '6. Visual Custody Chain',
      desc: 'Every time evidence changes hands (e.g., IO to Malkhana, or Malkhana to FSL), the handoff is cryptographically signed. Click on the timeline to see it.',
      action: () => router.push('/cases/case-041') // Would ideally switch tab here
    },
    {
      title: '7. Red Team Tamper Attack',
      desc: 'What if a hacker tries to modify the evidence directly in the database? Let us simulate a tamper attack.',
      action: () => router.push('/integrity-monitor')
    },
    {
      title: '8. Generate Sec 65B Certificate',
      desc: 'Once ready for court, generate the court-admissible BSA 2023 Sec 65B Certificate. It contains the hash, Merkle root, and a verification QR code.',
      action: () => router.push('/documents/doc-001/cert')
    },
    {
      title: '9. Public QR Verification',
      desc: 'A judge or lawyer can scan the QR code to verify the evidence without logging in. The zero-knowledge portal recomputes the Merkle path.',
      action: () => window.open('/verify', '_blank')
    }
  ];

  // Expose a global method to open the guide
  useEffect(() => {
    (window as any).startDemoGuide = () => {
      setIsOpen(true);
      setCurrentStep(0);
      steps[0].action();
    };
  }, [router]);

  if (!isOpen) return null;

  const step = steps[currentStep];

  const handleNext = () => {
    const nextIdx = currentStep + 1;
    if (nextIdx < steps.length) {
      setCurrentStep(nextIdx);
      steps[nextIdx].action();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '300px',
      backgroundColor: '#1E293B',
      color: '#F8FAFC',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>
        Demo Step {currentStep + 1} of {steps.length}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
        {step.title}
      </div>
      <div style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '16px', lineHeight: 1.5 }}>
        {step.desc}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button style={{ background: 'none', border: '1px solid #475569', color: '#F8FAFC', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }} onClick={handleClose}>
          Close
        </button>
        {currentStep < steps.length - 1 ? (
          <button style={{ background: '#3B82F6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleNext}>
            Next ➔
          </button>
        ) : (
          <button style={{ background: '#10B981', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleClose}>
            Finish Demo ✓
          </button>
        )}
      </div>
    </div>
  );
}
