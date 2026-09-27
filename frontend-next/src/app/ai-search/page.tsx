"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { API } from '@/lib/api';
import { useAppState } from '@/lib/StateContext';
import { useRouter } from 'next/navigation';

interface CaseOption {
  id: string;
  fir_number?: string;
  case_number?: string;
  description?: string;
}

export default function AISearchPage() {
  const { language } = useAppState();
  const isHindi = language === 'HI';
  const router = useRouter();

  const [query, setQuery] = useState('Find financial evidence or CCTV footage');
  const [caseList, setCaseList] = useState<CaseOption[]>([]);
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

  // 1. Fetch available cases for dynamic dropdown
  useEffect(() => {
    async function loadCases() {
      try {
        const res = await API.get('/cases');
        if (res.data?.cases && res.data.cases.length > 0) {
          setCaseList(res.data.cases);
        }
      } catch (e) {
        console.error('Failed to load case filter list:', e);
      }
    }
    loadCases();
  }, []);

  const executeSearch = useCallback(async (overrideQuery?: string) => {
    const q = overrideQuery !== undefined ? overrideQuery : query;
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
      console.error('Semantic search error:', e);
      setError(e.message || 'Failed to execute semantic search');
    } finally {
      setIsLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    executeSearch();
  }, [filters, executeSearch]);

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

  return (
    <div>
      <div className="page-header-bar">
        <div className="page-title-group">
          <h1>{isHindi ? 'एआई स्मार्ट खोज प्रणाली' : 'AI Smart Search & Semantic Index'}</h1>
          <div className="page-subtitle">
            Natural language semantic query across cases, documents, evidence exhibits, and officer records
          </div>
        </div>
      </div>

      {/* Large Government Search Bar */}
      <div className="gov-card" style={{ padding: '24px', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-control"
              style={{ flex: 1, padding: '12px 16px', fontSize: '15px', border: '2px solid var(--gov-navy-primary)' }}
              placeholder="Search evidence using natural language... (e.g. Find CCTV footage or Bank diversion)"
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔍 <span>Search</span>
            </button>
          </div>
        </form>

        {/* Suggested Natural Language Query Chips */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>
            Suggested Inquiries:
          </span>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('CCTV Camera entryway')}>
            "CCTV Camera entryway"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('State Bank financial audit diversion')}>
            "State Bank financial audit diversion"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('Forensic NVMe disk clone')}>
            "Forensic NVMe disk clone"
          </button>
          <button className="btn btn-secondary btn-sm" style={{ fontSize: '11px' }} onClick={() => performQuickSearch('Witness deposition cash transfer')}>
            "Witness deposition cash transfer"
          </button>
        </div>
      </div>

      {/* Search Facet Filters */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <label className="filter-label">Correlated Case:</label>
          <select className="form-control" value={filters.caseId} onChange={e => setFilters({...filters, caseId: e.target.value})}>
            <option value="ALL">All Investigated Cases</option>
            {caseList.map(c => {
              const num = c.fir_number || c.case_number || 'CASE-2026';
              return (
                <option key={c.id} value={num}>
                  {num} {c.description ? `(${c.description.substring(0, 30)}...)` : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Document Type:</label>
          <select className="form-control" value={filters.documentType} onChange={e => setFilters({...filters, documentType: e.target.value})}>
            <option value="ALL">All Evidence Types</option>
            <option value="CCTV">CCTV Video Footage</option>
            <option value="FINANCIAL_AUDIT">Financial Audit</option>
            <option value="FORENSIC_REPORT">Forensic Report</option>
            <option value="STATEMENT">Witness Statement</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Classification:</label>
          <select className="form-control" value={filters.classification} onChange={e => setFilters({...filters, classification: e.target.value})}>
            <option value="ALL">All Security Tiers</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="SECRET">SECRET</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Min Relevance:</label>
          <select className="form-control" value={filters.minRelevance} onChange={e => setFilters({...filters, minRelevance: e.target.value})}>
            <option value="70">70% Match Threshold</option>
            <option value="80">80% Match Threshold</option>
            <option value="90">90% Strict Match</option>
          </select>
        </div>
      </div>

      {/* Search Results Area */}
      <div>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gov-text-secondary)' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div style={{ marginTop: '8px', fontWeight: 700 }}>Searching semantic vector indices and evidence records...</div>
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--status-critical)', padding: '20px', textAlign: 'center', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)' }}>
            Failed to execute semantic search: {error}
          </div>
        )}

        {!isLoading && !error && searchResults.length === 0 && (
          <div className="gov-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--gov-text-muted)' }}>
            No government evidentiary records matched "{lastQuery}" with the selected filter criteria.
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
                let relColor = 'var(--status-active)';
                if (item.relevanceScore < 85) relColor = 'var(--gov-saffron)';

                return (
                  <div key={idx} className="gov-card" style={{ marginBottom: 0, padding: '18px', borderLeft: `4px solid ${relColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gov-navy-primary)' }}>{idx + 1}. {item.file_name}</span>
                          <span className="badge badge-info">{item.document_type}</span>
                          <span className="badge badge-confidential">{item.security_classification}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--gov-text-secondary)', marginTop: '4px' }}>
                          <strong>Case FIR:</strong> <span className="font-mono">{item.case_number || item.case_id}</span> •
                          <strong>Document ID:</strong> <span className="font-mono">{item.document_number}</span> •
                          <strong>Custodian / Uploader:</strong> {item.uploader_name || 'Investigating Officer'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '140px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gov-text-muted)' }}>AI Relevance Score</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: relColor }}>{item.relevanceScore}%</div>
                        <div className="progress-bar-container" style={{ height: '6px', marginTop: '2px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="progress-bar-fill" style={{ width: `${item.relevanceScore}%`, backgroundColor: relColor, height: '100%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--gov-surface-alt)', padding: '12px 14px', border: '1px solid var(--gov-border-light)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--gov-text-secondary)', margin: '8px 0', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--gov-navy-dark)' }}>Semantic NLP Match:</strong> {item.ocr_extracted_text || item.file_name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--gov-text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                      <div className="font-mono">SHA-256: {item.sha256_hash ? `${item.sha256_hash.substring(0, 32)}...` : 'Bitstream Sealed'}</div>
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
