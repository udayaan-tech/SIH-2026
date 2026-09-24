/**
 * CASEVAULT — AI Smart Search View
 * Section 14: Natural language search across cases, documents, and evidence with relevance scoring (96%, 93%, 89%)
 */
const AISearchView = {
  searchResults: [],

  render(container) {
    const isHindi = State.language === 'HI';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'एआई स्मार्ट खोज प्रणाली' : 'AI Smart Search'}</h1>
          <div class="page-subtitle">
            Natural language semantic query across cases, documents, evidence exhibits, and officer records
          </div>
        </div>
      </div>

      <!-- Large Government Search Bar (Section 14) -->
      <div class="gov-card" style="padding: 24px; background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);">
        <form onsubmit="AISearchView.handleSearch(event)">
          <div style="display: flex; gap: 10px;">
            <input type="text" id="ai-search-input" class="form-control"
              style="flex: 1; padding: 12px 16px; font-size: 15px; border: 2px solid var(--gov-navy-primary);"
              placeholder="Search cases, documents, evidence or people... (e.g. Find financial evidence related to Case 041)"
              value="Find financial evidence related to Case 041" />
            <button type="submit" class="btn btn-primary" style="padding: 0 24px; font-size: 14px;">
              🔍 [ Search ]
            </button>
          </div>
        </form>

        <!-- Suggested Natural Language Query Chips (Section 14) -->
        <div style="margin-top: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted);">
            Example Inquiries:
          </span>
          <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="AISearchView.performQuickSearch('Find financial evidence related to Case 041')">
            "Find financial evidence related to Case 041"
          </button>
          <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="AISearchView.performQuickSearch('Forensic disk reports for EIU')">
            "Forensic disk reports for EIU"
          </button>
          <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="AISearchView.performQuickSearch('Witness statements citing Rajesh Verma')">
            "Witness statements citing Rajesh Verma"
          </button>
          <button class="btn btn-secondary btn-sm" style="font-size: 11px;" onclick="AISearchView.performQuickSearch('SCADA malware telemetry CCD')">
            "SCADA malware telemetry CCD"
          </button>
        </div>
      </div>

      <!-- Search Facet Filters (Section 14) -->
      <div class="filter-toolbar">
        <div class="filter-group">
          <label class="filter-label">Case:</label>
          <select id="ai-filter-case" class="form-control" onchange="AISearchView.executeCurrentSearch()">
            <option value="ALL">All Cases</option>
            <option value="case-041" selected>CASE-2026-041 (Apex FinCorp)</option>
            <option value="case-038">CASE-2026-038 (Power Grid SCADA)</option>
            <option value="case-031">CASE-2026-031 (Auditor Disappearance)</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Document Type:</label>
          <select id="ai-filter-type" class="form-control" onchange="AISearchView.executeCurrentSearch()">
            <option value="ALL">All Document Types</option>
            <option value="Financial Audit">Financial Audit</option>
            <option value="Forensic Report">Forensic Report</option>
            <option value="Witness Statement">Witness Statement</option>
            <option value="Court Filing">Court Filing</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Classification:</label>
          <select id="ai-filter-class" class="form-control" onchange="AISearchView.executeCurrentSearch()">
            <option value="ALL">All Tiers</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="SECRET">SECRET</option>
            <option value="TOP SECRET">TOP SECRET</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Minimum Relevance:</label>
          <select id="ai-filter-relevance" class="form-control" onchange="AISearchView.executeCurrentSearch()">
            <option value="70">70% Match</option>
            <option value="80">80% Match</option>
            <option value="90">90% Match</option>
          </select>
        </div>
      </div>

      <!-- Search Results Area -->
      <div id="ai-search-results-pane">
        <div style="text-align: center; padding: 30px; color: var(--gov-text-muted);">
          Click Search or choose an example query to initiate semantic discovery.
        </div>
      </div>
    `;

    // Automatically trigger initial default query
    setTimeout(() => this.executeCurrentSearch(), 100);
  },

  handleSearch(e) {
    if (e) e.preventDefault();
    this.executeCurrentSearch();
  },

  performQuickSearch(queryText) {
    document.getElementById('ai-search-input').value = queryText;
    this.executeCurrentSearch();
  },

  async executeCurrentSearch() {
    const q = document.getElementById('ai-search-input')?.value || 'Find financial evidence related to Case 041';
    const caseId = document.getElementById('ai-filter-case')?.value || 'ALL';
    const documentType = document.getElementById('ai-filter-type')?.value || 'ALL';
    const classification = document.getElementById('ai-filter-class')?.value || 'ALL';
    const minRelevance = document.getElementById('ai-filter-relevance')?.value || '70';

    const resultsPane = document.getElementById('ai-search-results-pane');
    if (!resultsPane) return;

    resultsPane.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <span style="font-size: 20px;">⚡</span> Searching semantic vector indices and case repositories...
      </div>
    `;

    try {
      const res = await API.get('/ai/search', {
        q,
        caseId,
        documentType,
        classification,
        minRelevance
      });

      this.searchResults = res.data || [];
      this.renderResults(resultsPane, q);
    } catch (e) {
      resultsPane.innerHTML = `
        <div style="color: var(--status-critical); padding: 20px; text-align: center;">
          Failed to execute semantic search: ${e.message}
        </div>
      `;
    }
  },

  renderResults(container, query) {
    if (this.searchResults.length === 0) {
      container.innerHTML = `
        <div class="gov-card" style="padding: 30px; text-align: center; color: var(--gov-text-muted);">
          No government records or evidentiary assets matched "${query}" with selected filters.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="font-size: 13px; font-weight: 700; color: var(--gov-navy-dark); margin-bottom: 12px; display: flex; justify-content: space-between;">
        <span>AI SMART SEARCH RESULTS FOR: "${query}"</span>
        <span style="color: var(--gov-text-muted); font-weight: 600;">Found ${this.searchResults.length} Correlated Records</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${this.searchResults.map((item, idx) => {
          let relColor = '#0A6E31';
          if (item.relevanceScore < 85) relColor = '#B25E00';

          return `
            <div class="gov-card" style="margin-bottom: 0; padding: 18px; border-left: 4px solid ${relColor};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px; font-weight: 800; color: var(--gov-navy-primary);">${idx + 1}. ${item.file_name}</span>
                    <span class="badge badge-info">${item.document_type}</span>
                    <span class="badge badge-confidential">${item.security_classification}</span>
                  </div>
                  <div style="font-size: 12px; color: var(--gov-text-secondary); margin-top: 3px;">
                    <strong>Case:</strong> <span class="font-mono">${item.case_number || item.case_id}</span> •
                    <strong>Document ID:</strong> <span class="font-mono">${item.document_number}</span> •
                    <strong>Uploaded By:</strong> ${item.uploader_name || 'Officer'}
                  </div>
                </div>

                <!-- Relevance Score (Section 14: 96%, 93%, 89%) -->
                <div style="text-align: right; min-width: 140px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted);">AI Relevance Score</div>
                  <div style="font-size: 20px; font-weight: 800; color: ${relColor};">${item.relevanceScore}%</div>
                  <div class="progress-bar-container" style="height: 6px; margin-top: 2px;">
                    <div class="progress-bar-fill" style="width: ${item.relevanceScore}%; background-color: ${relColor};"></div>
                  </div>
                </div>
              </div>

              <!-- Snippet Match -->
              <div style="background-color: var(--gov-surface-alt); padding: 10px 14px; border: 1px solid var(--gov-border-light); border-radius: var(--radius-sm); font-size: 12px; color: var(--gov-text-secondary); margin: 8px 0; line-height: 1.6;">
                <strong>Semantic Text Match:</strong> ${item.ocr_extracted_text || item.title}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-size: 11px; color: var(--gov-text-muted);">
                <div class="font-mono">SHA-256: ${item.sha256_hash.substring(0, 32)}...</div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-secondary btn-sm" onclick="App.openDocViewer('${item.id}')">
                    Inspect Document & SHA-256 →
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};

window.AISearchView = AISearchView;
