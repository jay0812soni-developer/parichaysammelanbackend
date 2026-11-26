import express from 'express';
import cors from 'cors';
import { config, missingCriticalEnv } from './config.js';
import { ensureAdminSeeded } from './auth.js';
import { entriesRouter } from './routes/entries.js';
import { uploadsRouter } from './routes/uploads.js';
import { adminRouter } from './routes/admin.js';
import { pool } from './db.js';
import { apiLimiter, authLimiter, securityHeaders } from './security.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(securityHeaders);
app.use(
  cors({
    origin(origin, cb) {
      // Mobile apps often send no Origin; allow those.
      if (!origin) return cb(null, true);
      if (config.corsOrigins.includes('*') || config.corsOrigins.length === 0) {
        return cb(null, true);
      }
      if (config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);
app.use('/api/admin/login', authLimiter);

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, version: '1.0.5' });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use('/api/entries', entriesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/admin', adminRouter);

app.use((err, _req, res, _next) => {
  console.error(err.message || err);
  const msg = err.message || '';
  if (msg.includes('Only image')) {
    return res.status(400).json({ success: false, error: msg });
  }
  if (msg.includes('CORS')) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  res.status(500).json({ success: false, error: 'Server error' });
});

async function boot() {
  const missing = missingCriticalEnv();
  if (missing.length) {
    console.error('Missing env:', missing.join(', '));
  }
  try {
    await ensureAdminSeeded();
  } catch (e) {
    console.warn('Admin seed skipped:', e.message);
  }
  app.listen(config.port, () => {
    console.log(`Parichay Sammelan API 1.0.5 on :${config.port}`);
  });
}

boot();
