/**
 * CASEVAULT — AI Document Intelligence View
 * Section 13: Document Classification (FIR 96%), Entity Extraction, Analytical Summary, Key Dates
 */
const AIIntelView = {
  currentIntel: null,

  async render(container) {
    const isHindi = State.language === 'HI';
    const docId = State.selectedDocId || 'doc-001';

    container.innerHTML = `
      <div class="page-header-bar">
        <div class="page-title-group">
          <h1>${isHindi ? 'एआई दस्तावेज़ बुद्धिमत्ता' : 'AI Document Intelligence'}</h1>
          <div class="page-subtitle">
            Automated legal natural language processing, entity extraction, and case correlation analysis
          </div>
        </div>
        <div class="page-actions">
          <select id="intel-doc-selector" class="form-control" onchange="AIIntelView.switchDoc(this.value)">
            <option value="doc-001" selected>FIR_2026_041.pdf (FIR No. 41/2026)</option>
            <option value="doc-002">Forensic_Report.pdf (Disk Clone Extraction)</option>
            <option value="doc-004">Bank_Transaction_Report.pdf (State Bank Audit)</option>
            <option value="doc-005">Witness_Statement_07.pdf (CAO Deposition)</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="AIIntelView.reAnalyze()">
            ⚡ Re-Analyze NLP Model
          </button>
        </div>
      </div>

      <div id="intel-loading" style="text-align: center; padding: 40px;">
        Processing natural language intelligence for selected document...
      </div>
      <div id="intel-content" style="display: none;"></div>
    `;

    await this.fetchIntel(docId);
  },

  async switchDoc(docId) {
    document.getElementById('intel-loading').style.display = 'block';
    document.getElementById('intel-content').style.display = 'none';
    await this.fetchIntel(docId);
  },

  async reAnalyze() {
    alert('NLP pipeline triggered. Re-verifying entity boundaries and confidence scores.');
  },

  async fetchIntel(docId) {
    try {
      const res = await API.get(`/ai/document-intel/${docId}`);
      this.currentIntel = res.data;
      this.renderContent(document.getElementById('intel-content'));
      document.getElementById('intel-loading').style.display = 'none';
      document.getElementById('intel-content').style.display = 'block';
    } catch (e) {
      document.getElementById('intel-loading').innerHTML = `
        <div style="color: var(--status-critical); padding: 20px;">
          Failed to load AI Intelligence: ${e.message}
        </div>
      `;
    }
  },

  renderContent(container) {
    const data = this.currentIntel;
    const cls = data.classification;
    const ent = data.extractedEntities;

    container.innerHTML = `
      <!-- Top Diagnostic Metric Cards (Section 13) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div class="stat-card" style="border-top-color: var(--gov-navy-primary);">
          <div class="stat-title">DOCUMENT CLASSIFICATION</div>
          <div class="stat-value" style="font-size: 22px;">${cls.predictedType}</div>
          <div class="stat-subtext">Confidence: <strong style="color: var(--gov-green);">${cls.confidence}%</strong></div>
        </div>

        <div class="stat-card stat-active">
          <div class="stat-title">DETECTED CASE</div>
          <div class="stat-value font-mono" style="font-size: 20px;">${data.caseId}</div>
          <div class="stat-subtext">Apex FinCorp Investigation</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">PAGES & TOKENS</div>
          <div class="stat-value">14 <span style="font-size: 14px; color: var(--gov-text-muted);">Pages</span></div>
          <div class="stat-subtext">4,812 tokens analyzed</div>
        </div>

        <div class="stat-card">
          <div class="stat-title">LANGUAGE DETECTED</div>
          <div class="stat-value" style="font-size: 16px; margin: 10px 0 6px 0;">English (IN) / Legal Hindi</div>
          <div class="stat-subtext">Mixed OCR Latin / Devanagari</div>
        </div>
      </div>

      <!-- Main Intelligence Grid -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
        
        <!-- Left: AI Analytical Summary & Extracted Entities -->
        <div>
          <!-- Concise AI Summary (Section 13) -->
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">
                <span>🤖</span> AI Executive Summary & Key Information
              </div>
            </div>
            <div class="gov-card-body" style="font-size: 13px; line-height: 1.7;">
              <div style="background-color: var(--gov-surface-alt); border-left: 4px solid var(--gov-navy-primary); padding: 12px 16px; margin-bottom: 14px; font-weight: 500;">
                ${data.aiSummary}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; margin-top: 10px;">
                <div><strong>Primary Subject:</strong> Rajesh Verma (Managing Director)</div>
                <div><strong>Primary Offence:</strong> Loan Diversion & Bogus Invoicing</div>
                <div><strong>Key Evidence Ref:</strong> FSD-DL-2026-089 (NVMe Bitstream)</div>
                <div><strong>Court Status:</strong> Pre-Charge Sheet Scrutiny</div>
              </div>
            </div>
          </div>

          <!-- Extracted Entities (Section 13) -->
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">
                <span>🏷</span> Named Entity Recognitions (NER)
              </div>
            </div>
            <div class="gov-card-body" style="display: flex; flex-direction: column; gap: 14px;">
              <div>
                <div class="info-label">Case & Reference Identifiers</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.caseNumbers.map(n => `<span class="badge badge-info">${n}</span>`).join('')}
                </div>
              </div>

              <div>
                <div class="info-label">Officer Names & Jurisdictional Actors</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.officerNames.map(n => `<span class="badge badge-secondary" style="border: 1px solid var(--gov-border);">${n}</span>`).join('')}
                </div>
              </div>

              <div>
                <div class="info-label">Suspect Corporate & Individual Entities</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.suspectEntities.map(s => `<span class="badge badge-critical">${s}</span>`).join('')}
                </div>
              </div>

              <div>
                <div class="info-label">Statutory Legal Sections Cited</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.legalSections.map(s => `<span class="badge badge-secret">${s}</span>`).join('')}
                </div>
              </div>

              <div>
                <div class="info-label">Monetary Quantums & Financial Values</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.monetaryAmounts.map(m => `<span class="badge badge-confidential" style="font-weight: 700;">${m}</span>`).join('')}
                </div>
              </div>

              <div>
                <div class="info-label">Geographic Locations & Jurisdictions</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                  ${ent.locations.map(l => `<span class="badge badge-secondary">${l}</span>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Important Dates & Related Corroborations -->
        <div>
          <!-- Important Dates (Section 13) -->
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">
                <span>📅</span> Chronological Milestones Detected
              </div>
            </div>
            <div class="gov-card-body" style="padding: 12px;">
              <div class="timeline-list">
                ${data.importantDates.map(d => `
                  <div class="timeline-step completed">
                    <div class="timeline-marker">•</div>
                    <div class="timeline-content">
                      <div class="timeline-title">${d.event}</div>
                      <div class="timeline-time">${d.date}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Related Documents & Corroborating Evidence (Section 13) -->
          <div class="gov-card">
            <div class="gov-card-header">
              <div class="gov-card-title">
                <span>🔗</span> Corroborating Files & Exhibits
              </div>
            </div>
            <div class="gov-card-body" style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted);">Related Documents</div>
              ${data.relatedDocuments.map(rd => `
                <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border-light); padding: 8px 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 12px;">${rd.name}</div>
                    <div style="font-size: 10px; color: var(--gov-text-muted);">${rd.matchReason}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="App.openDocViewer('${rd.id}')">View</button>
                </div>
              `).join('')}

              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--gov-text-muted); margin-top: 10px;">Related Evidence Exhibits</div>
              ${data.relatedEvidence.map(re => `
                <div style="background-color: var(--gov-surface-alt); border: 1px solid var(--gov-border-light); padding: 8px 10px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-size: 12px;">${re.name}</div>
                    <div style="font-size: 10px; color: var(--gov-text-muted);">Custodian: ${re.custodian}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" onclick="App.openEvidenceChain('${re.id}')">Chain</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

      </div>
    `;
  }
};

window.AIIntelView = AIIntelView;
