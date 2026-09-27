const http = require('http');

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', reject); req.write(JSON.stringify(body)); req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search,
      method: 'GET', headers
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject); req.end();
  });
}

async function run() {
  const s1 = await post('http://localhost:8080/api/v1/auth/login', { badge_id: 'DL-4821', password: 'password123' });
  const s2 = await post('http://localhost:8080/api/v1/auth/mfa/verify', { session_token: s1.data.data.session_token, otp: s1.data.data.demo_otp });
  const token = s2.data.data.token;
  console.log('✓ Token issued for DL-4821\n');

  const tests = [
    ['/dashboard/stats', 'http://localhost:8080/api/v1/dashboard/stats'],
    ['/dashboard/feed', 'http://localhost:8080/api/v1/dashboard/feed'],
    ['/documents', 'http://localhost:8080/api/v1/documents'],
    ['/custody/pending', 'http://localhost:8080/api/v1/custody/pending'],
    ['/custody/officers', 'http://localhost:8080/api/v1/custody/officers'],
    ['/security/overview', 'http://localhost:8080/api/v1/security/overview'],
    ['/ai/document-intel', 'http://localhost:8080/api/v1/ai/document-intel/doc-001'],
    ['/ai/search', 'http://localhost:8080/api/v1/ai/search?q=financial'],
    ['/audit', 'http://localhost:8080/api/v1/audit?limit=10'],
    ['/audit/verify', 'http://localhost:8080/api/v1/audit/verify'],
    ['/public/verify (No Auth)', 'http://localhost:8080/api/v1/public/verify/7b2e91f3a8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0']
  ];

  for (const [name, url] of tests) {
    const isPublic = name.includes('No Auth');
    const res = await get(url, isPublic ? null : token);
    const ok = res.status === 200 && (res.data?.success !== false);
    console.log(`${name.padEnd(25)} -> HTTP ${res.status} [${ok ? 'OK ✓' : 'FAILED ✗'}]`);
  }
}

run().catch(console.error);
