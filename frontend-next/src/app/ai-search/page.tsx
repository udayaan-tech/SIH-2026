"use client";

import React, { useState, useEffect } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';
import { useRouter } from 'next/navigation';

export default function AISearchPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';
  const router = useRouter();

  const [query, setQuery] = useState('Find financial evidence related to Case 041');
  const [filters, setFilters] = useState({
    caseId: 'ALL',
    documentType: 'ALL',
    classification: 'ALL',
    minRelevance: '70'
  });
  
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    executeSearch();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const performQuickSearch = (queryText: string) => {
    setQuery(queryText);
    setTimeout(() => {
      executeSearch(queryText);
    }, 0);
  };

  const executeSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    setIsLoading(true);
    setError('');
    setLastQuery(q);

    try {
      const res = await API.get('/ai/search', {
        q,
        ...filters
      });
      setSearchResults(res.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to execute semantic search');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'एआई स्मार्ट खोज प्रणाली' : 'AI Smart Search'}</h1>
          <div className="page-subtitle">
            Natural language semantic query across cases, documents, evidence exhibits, and officer records
          </div>
        </div>
      </div>

      {/* Large Government Search Bar */}
      <div className="gov-card" style={{ padding: '24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" className="form-control"
              style={{ flex: 1, padding: '12px 16px', fontSize: '15px', border: '2px solid var(--gov-navy-primary)' }}
              placeholder="Search cases, documents, evidence or people... (e.g. Find financial evidence related to Case 041)"
              value={query} onChange={e => setQuery(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', fontSize: '14px' }}>
              🔍 [ Search ]
            </button>
          </div>
        </form>

        {/* Suggested Natural Language Query Chips */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>
            Example Inquiries:
          </span>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('Find financial evidence related to Case 041')}>
            "Find financial evidence related to Case 041"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('Forensic disk reports for EIU')}>
            "Forensic disk reports for EIU"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('Witness statements citing Rajesh Verma')}>
            "Witness statements citing Rajesh Verma"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('SCADA malware telemetry CCD')}>
            "SCADA malware telemetry CCD"
          </button>
        </div>
      </div>

      {/* Search Facet Filters */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <label className="filter-label">Case:</label>
          <select className="form-control" value={filters.caseId} onChange={e => setFilters({...filters, caseId: e.target.value})}>
            <option value="ALL">All Cases</option>
            <option value="case-041">CASE-2026-041 (Apex FinCorp)</option>
            <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
            <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Document Type:</label>
          <select className="form-control" value={filters.documentType} onChange={e => setFilters({...filters, documentType: e.target.value})}>
            <option value="ALL">All Document Types</option>
            <option value="Financial Audit">Financial Audit</option>
            <option value="Forensic Report">Forensic Report</option>
            <option value="Witness Statement">Witness Statement</option>
            <option value="Court Filing">Court Filing</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Classification:</label>
          <select className="form-control" value={filters.classification} onChange={e => setFilters({...filters, classification: e.target.value})}>
            <option value="ALL">All Tiers</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="SECRET">SECRET</option>
            <option value="TOP SECRET">TOP SECRET</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Minimum Relevance:</label>
          <select className="form-control" value={filters.minRelevance} onChange={e => setFilters({...filters, minRelevance: e.target.value})}>
            <option value="70">70% Match</option>
            <option value="80">80% Match</option>
            <option value="90">90% Match</option>
          </select>
        </div>
      </div>

      {/* Search Results Area */}
      <div>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span> Searching semantic vector indices and case repositories...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--status-critical)', padding: '20px', textAlign: 'center' }}>
            Failed to execute semantic search: {error}
          </div>
        )}

        {!isLoading && !error && searchResults.length === 0 && (
          <div className="gov-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--gov-text-muted)' }}>
            No government records or evidentiary assets matched "{lastQuery}" with selected filters.
          </div>
        )}

        {!isLoading && !error && searchResults.length > 0 && (
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>AI SMART SEARCH RESULTS FOR: "{lastQuery}"</span>
              <span style={{ color: 'var(--gov-text-muted)', fontWeight: 600 }}>Found {searchResults.length} Correlated Records</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {searchResults.map((item, idx) => {
                let relColor = '#0A6E31';
                if (item.relevanceScore < 85) relColor = '#B25E00';

                return (
                  <div key={idx} className="gov-card" style={{ marginBottom: 0, padding: '18px', borderLeft: `4px solid ${relColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gov-navy-primary)' }}>{idx + 1}. {item.file_name}</span>
                          <span className="badge badge-info">{item.document_type}</span>
                          <span className="badge badge-confidential">{item.security_classification}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', marginTop: '3px' }}>
                          <strong>Case:</strong> <span className="font-mono">{item.case_number || item.case_id}</span> •
                          <strong>Document ID:</strong> <span className="font-mono">{item.document_number}</span> •
                          <strong>Uploaded By:</strong> {item.uploader_name || 'Officer'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '140px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>AI Relevance Score</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: relColor }}>{item.relevanceScore}%</div>
                        <div className="progress-bar-container" style={{ height: '6px', marginTop: '2px' }}>
                          <div className="progress-bar-fill" style={{ width: `${item.relevanceScore}%`, backgroundColor: relColor }}></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--gov-surface-alt)', padding: '10px 14px', border: '1px solid var(--gov-border-light)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--gov-text-secondary)', margin: '8px 0', lineHeight: 1.6 }}>
                      <strong>Semantic Text Match:</strong> {item.ocr_extracted_text || item.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--gov-text-muted)' }}>
                      <div className="font-mono">SHA-256: {item.sha256_hash?.substring(0, 32)}...</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/documents/${item.id}`)}>
                          Inspect Document & SHA-256 →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
