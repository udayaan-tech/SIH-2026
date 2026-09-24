"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CertPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>BSA 2023 Sec 65B Certificate</h1>
          <div className="page-subtitle">
            Court-Admissible Electronic Evidence Certification
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${docId}`)}>← Back to Viewer</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>🖨 Print for Court</button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert('Downloading PDF...')}>Download PDF</button>
          <button className="btn btn-saffron btn-sm" onClick={() => alert('Shared with Prosecutor securely via NDIS.')}>Share with Prosecutor</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', border: '1px solid #ccc', width: '100%', maxWidth: '800px', padding: '60px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: "'Times New Roman', serif" }}>
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>≡ ASHOKA EMBLEM ≡</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>GOVERNMENT OF INDIA</div>
            <div style={{ fontSize: '16px' }}>MINISTRY OF HOME AFFAIRS</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>NATIONAL DIGITAL INVESTIGATION SERVICES (NDIS)</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: 'underline' }}>CERTIFICATE UNDER SECTION 65B</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>BHARATIYA SAKSHYA ADHINIYAM, 2023</div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.8, marginBottom: '30px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ width: '30%', fontWeight: 'bold', padding: '5px 0' }}>Case No:</td><td>FIR-DEL-2026-0421</td></tr>
                <tr><td style={{ fontWeight: 'bold', padding: '5px 0' }}>Document:</td><td>CCTV_Footage_Camera3.mp4</td></tr>
                <tr><td style={{ fontWeight: 'bold', padding: '5px 0' }}>Document ID:</td><td>{docId}</td></tr>
                <tr><td style={{ fontWeight: 'bold', padding: '5px 0' }}>SHA-256 Hash:</td><td className="font-mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>a3f9b2c1d4e5f6a7b8c9d0e1f2...</td></tr>
                <tr><td style={{ fontWeight: 'bold', padding: '5px 0' }}>Merkle Root:</td><td className="font-mono" style={{ fontSize: '12px', wordBreak: 'break-all' }}>7f8a9b0c1d2e3f4a5b6c7d...</td></tr>
                <tr><td style={{ fontWeight: 'bold', padding: '5px 0' }}>Blockchain Anchor:</td><td className="font-mono" style={{ fontSize: '12px' }}>Polygon Tx #0x4a8f...</td></tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: '14px', lineHeight: 1.8, marginBottom: '40px', textAlign: 'justify' }}>
            <p>I hereby certify that:</p>
            <ol style={{ paddingLeft: '20px', listStyleType: 'lower-alpha' }}>
              <li>The electronic record was produced by a computer in regular use.</li>
              <li>The information was fed in the regular course of activities.</li>
              <li>The computer was operating properly during the relevant period.</li>
              <li>The contents of this digital record are a true and accurate reproduction of the original data.</li>
            </ol>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }}>
            <div>
              <div style={{ border: '2px solid #000', padding: '40px', display: 'inline-block', textAlign: 'center', fontWeight: 'bold' }}>
                [QR CODE]<br/><span style={{ fontSize: '10px', fontWeight: 'normal' }}>Scan to verify on public portal</span>
              </div>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '14px' }}>
              <div style={{ fontStyle: 'italic', marginBottom: '10px' }}>Digital Seal: RS256 Signature</div>
              <div style={{ fontWeight: 'bold' }}>Certifying Officer:</div>
              <div>SI Rajesh Sharma (#DL-4821)</div>
              <div>Date: 23 September 2026</div>
              <div>Place: New Delhi</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
