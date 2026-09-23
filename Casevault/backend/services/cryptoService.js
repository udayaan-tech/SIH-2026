const crypto = require('crypto');

/**
 * Government-Grade Cryptographic Service
 * Provides SHA-256 document hashing, digital signature generation,
 * verification, tamper-evident checksums, and secure random identifiers.
 */
class CryptoService {
  /**
   * Generates a 64-character SHA-256 hexadecimal hash
   * @param {Buffer|string} input - Raw binary buffer or text
   * @returns {string} Hexadecimal SHA-256 hash in uppercase
   */
  static generateSha256(input) {
    if (!input) return '';
    const hash = crypto.createHash('sha256');
    if (Buffer.isBuffer(input)) {
      hash.update(input);
    } else {
      hash.update(String(input), 'utf8');
    }
    return hash.digest('hex').toUpperCase();
  }

  /**
   * Verifies if calculated hash matches registered ledger hash
   */
  static verifyHash(calculatedHash, registeredHash) {
    if (!calculatedHash || !registeredHash) return false;
    return calculatedHash.trim().toUpperCase() === registeredHash.trim().toUpperCase();
  }

  /**
   * Generates a simulated government digital signature certificate
   * Format: NDIS-DSIG-[ALG]-[HASH]-[TIMESTAMP]
   */
  static generateDigitalSignature(officerBadge, documentHash) {
    const timestamp = new Date().toISOString();
    const payload = `${officerBadge}:${documentHash}:${timestamp}`;
    const sig = crypto.createHmac('sha256', 'GOV-SECRET-KEY-NDIS-2026').update(payload).digest('hex').substring(0, 32).toUpperCase();
    return `NDIS-DSIG-ECDSA-P256-${sig}-${Date.now()}`;
  }

  /**
   * Generates a unique correlation Request ID for Zero-Trust traceability
   * e.g. req_8f72a91c4e
   */
  static generateRequestId() {
    return 'req_' + crypto.randomBytes(6).toString('hex');
  }

  /**
   * Generates a unique Case ID
   * e.g. CASE-2026-042
   */
  static generateCaseId(counter = 42) {
    const year = new Date().getFullYear();
    return `CASE-${year}-${String(counter).padStart(3, '0')}`;
  }

  /**
   * Generates an immutable audit record checksum
   */
  static generateAuditChecksum(logEntry) {
    const serialized = `${logEntry.timestamp}|${logEntry.officer_id}|${logEntry.action}|${logEntry.resource_id}|${logEntry.result}|${logEntry.request_id}`;
    return crypto.createHash('sha256').update(serialized).digest('hex').substring(0, 16).toUpperCase();
  }
}

module.exports = CryptoService;
