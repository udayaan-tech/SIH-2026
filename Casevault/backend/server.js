const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

// Initialize database
require('./services/db');

// Middleware
const authMiddleware = require('./middleware/auth');
const AuditLogger = require('./middleware/auditLogger');

// Routes
const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const documentsRoutes = require('./routes/documents');
const evidenceRoutes = require('./routes/evidence');
const aiRoutes = require('./routes/ai');
const auditRoutes = require('./routes/audit');
const securityRoutes = require('./routes/security');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const apiDocsRoutes = require('./routes/apiDocs');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Headers (Section 34.12)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'");
  next();
});

// Request correlation ID (Section 34.18)
app.use(AuditLogger.injectRequestId);

// CORS configuration (Section 34.11)
app.use(cors({
  origin: '*', // Prototype mode allows local development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Officer-ID', 'X-Request-ID']
}));

// Body parsers with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets
const FRONTEND_DIR = path.join(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR));

// Public API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/docs', apiDocsRoutes);

// Protected API routes (Zero-Trust Identity derivation - Section 34.1)
app.use('/api/v1/cases', authMiddleware, casesRoutes);
app.use('/api/v1/documents', authMiddleware, documentsRoutes);
app.use('/api/v1/evidence', authMiddleware, evidenceRoutes);
app.use('/api/v1/ai', authMiddleware, aiRoutes);
app.use('/api/v1/audit', authMiddleware, auditRoutes);
app.use('/api/v1/security', authMiddleware, securityRoutes);
app.use('/api/v1/reports', authMiddleware, reportsRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationsRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'CASEVAULT Core Operating Platform',
    authority: 'National Digital Investigation Services (NDIS)',
    environment: 'PROTOTYPE / DEMONSTRATION',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// API 404 handler
app.use('/api', (req, res, next) => {
  const error = new Error('API endpoint not found');
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
});

// Fallback to index.html for client-side routing (only for non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Safe Error Handler (Section 34.16)
app.use((err, req, res, next) => {
  console.error(`[ERROR] [${req.requestId}]`, err);
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while processing the request.',
      requestId: req.requestId,
      referenceEventId: 'EVT-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    }
  });
});

app.listen(PORT, () => {
  console.log('================================================================');
  console.log('  CASEVAULT — Secure Digital Case & Document Management System');
  console.log('  National Digital Investigation Services (NDIS)');
  console.log(`  Server online at: http://localhost:${PORT}`);
  console.log('  Zero-Trust RBAC: ACTIVE | Cryptographic Integrity: SHA-256');
  console.log('================================================================');
});
