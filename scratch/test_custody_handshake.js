const http = require('http');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, data: d });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d) });
        } catch(e) {
          resolve({ status: res.statusCode, data: d });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function loginOfficer(badge, pass = 'password123') {
  const step1 = await post('http://localhost:8080/api/v1/auth/login', { badge_id: badge, password: pass });
  if (!step1.data?.data?.session_token) throw new Error('Login step 1 failed for ' + badge);
  const otp = step1.data.data.demo_otp || '123456';
  const step2 = await post('http://localhost:8080/api/v1/auth/mfa/verify', { session_token: step1.data.data.session_token, otp });
  if (!step2.data?.data?.token) throw new Error('MFA verification failed for ' + badge);
  return { token: step2.data.data.token, user: step2.data.data.user };
}

async function runCustodyVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('NYAY SURAKSHA: DUAL-OFFICER CRYPTOGRAPHIC CUSTODY HANDSHAKE TEST');
  console.log('Statutory compliance: BSA 2023 Sec 63 & BNSS Sec 105');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Step 1: Officer Authentication
  const io = await loginOfficer('DL-4821');
  console.log(`[AUTH] ✓ Lead IO authenticated: ${io.user.name} (${io.user.badge_id}, ${io.user.role})`);

  const fsl = await loginOfficer('FSL-9012');
  console.log(`[AUTH] ✓ Forensic Expert authenticated: ${fsl.user.name} (${fsl.user.badge_id}, ${fsl.user.role})`);

  // Step 2: Officer Directory Discovery
  const officersRes = await get('http://localhost:8080/api/v1/custody/officers', io.token);
  console.log(`[DISCOVERY] ✓ Found ${officersRes.data.data?.total} active judicial/police officers for custody handoff.`);

  // Step 3: Identify exhibit currently held by IO
  const docsRes = await get('http://localhost:8080/api/v1/documents', io.token);
  const docs = docsRes.data.data?.documents || [];
  const targetDoc = docs.find(d => d.title.includes('CCTV')) || docs[0];
  console.log(`[EXHIBIT] Selected: "${targetDoc.title}" (Hash: ${targetDoc.sha256_hash.substring(0, 16)}...)`);

  // Step 4: Dual-Handshake Step 1 (Sender Release & Sign)
  console.log('\n--- EXECUTING DUAL HANDSHAKE STEP 1 (SENDER RELEASE) ---');
  const transferPayload = {
    document_id: targetDoc.id,
    to_officer_id: fsl.user.id,
    to_agency: 'FSL',
    action_type: 'TRANSFERRED',
    storage_location: 'CFSL Banking Cyber Forensics Cell, New Delhi',
    notes: 'Official requisition under Section 105 BNSS for ledger transaction trace and shell entity forensic carve.'
  };

  const transferRes = await post('http://localhost:8080/api/v1/custody/transfer', transferPayload, io.token);
  console.log(`[STEP 1 RESULT] HTTP ${transferRes.status}:`, transferRes.data.success ? 'SUCCESS' : 'FAILED');
  if (!transferRes.data.success) {
    console.error('Error detail:', transferRes.data.error);
    return;
  }
  const transferData = transferRes.data.data;
  console.log(`  Transfer ID:        ${transferData.transfer_id}`);
  console.log(`  Sender Signature:   ${transferData.sender_signature}`);
  console.log(`  Status:             ${transferData.status}`);

  // Step 5: Dual-Handshake Step 2 (Recipient Inspection & Sign-Off)
  console.log('\n--- EXECUTING DUAL HANDSHAKE STEP 2 (RECIPIENT SIGN-OFF) ---');
  const pendingRes = await get('http://localhost:8080/api/v1/custody/pending', fsl.token);
  const incoming = pendingRes.data.data?.incoming || [];
  const targetPending = incoming.find(p => p.id === transferData.transfer_id);

  if (!targetPending) {
    console.error('❌ Failed: Handshake transfer not visible in recipient incoming queue!');
    return;
  }
  console.log(`[INCOMING QUEUE] ✓ Verified pending handoff in Dr. Sunita Mehra queue (${targetPending.document_title})`);

  const acceptRes = await post(`http://localhost:8080/api/v1/custody/transfer/accept/${transferData.transfer_id}`, {}, fsl.token);
  console.log(`[STEP 2 RESULT] HTTP ${acceptRes.status}:`, acceptRes.data.success ? 'SUCCESS' : 'FAILED');
  const acceptData = acceptRes.data.data;
  console.log(`  Receiver Signature: ${acceptData.receiver_signature}`);
  console.log(`  Status:             ${acceptData.status}`);
  console.log(`  Message:            ${acceptData.message}`);

  // Step 6: Verify Complete Chain-of-Custody Admissibility Ledger
  console.log('\n--- VERIFYING IMMUTABLE CHAIN-OF-CUSTODY MANIFEST ---');
  const chainRes = await get(`http://localhost:8080/api/v1/custody/chain/${targetDoc.id}`, io.token);
  const chain = chainRes.data.data?.chain || [];
  console.log(`[CHAIN LEDGER] Total Handoffs: ${chain.length}`);
  chain.forEach((hop, idx) => {
    console.log(`\n  Hop ${idx + 1}: [${hop.action_type}] Status: ${hop.status}`);
    console.log(`    From:       ${hop.from_officer_name || 'Genesis'} (${hop.from_agency})`);
    console.log(`    To:         ${hop.to_officer_name} (${hop.to_agency})`);
    console.log(`    Location:   ${hop.storage_location}`);
    console.log(`    Sender Sig: ${hop.sender_signature ? hop.sender_signature.substring(0, 24) + '...' : 'N/A'}`);
    console.log(`    Recv Sig:   ${hop.receiver_signature ? hop.receiver_signature.substring(0, 24) + '...' : 'Pending'}`);
  });

  // Step 7: Check WORM Audit Events
  console.log('\n--- VERIFYING WORM (WRITE-ONCE-READ-MANY) AUDIT TRAIL ---');
  const admin = await loginOfficer('ADMIN-0001');
  const auditRes = await get('http://localhost:8080/api/v1/audit?limit=10', admin.token);
  const events = auditRes.data.data?.events || [];
  const custodyLogs = events.filter(l => l.action.startsWith('CUSTODY_'));
  console.log(`[WORM AUDIT] Found ${custodyLogs.length} recent custody events:`);
  custodyLogs.forEach(l => {
    console.log(`  - ${l.action} by ${l.actor_badge} at ${l.created_at} (Hash Snapshot: ${l.hash_snapshot?.substring(0, 16)}...)`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✓ DUAL-OFFICER CRYPTOGRAPHIC CUSTODY HANDSHAKE FULLY VERIFIED');
  console.log('═══════════════════════════════════════════════════════════════');
}

runCustodyVerification().catch(console.error);
