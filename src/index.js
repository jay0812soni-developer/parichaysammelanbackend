import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { ensureAdminSeeded } from './auth.js';
import { entriesRouter } from './routes/entries.js';
import { uploadsRouter } from './routes/uploads.js';
import { adminRouter } from './routes/admin.js';
import { pool } from './db.js';

const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin(origin, cb) {
    if (!origin || config.corsOrigins.length === 0) return cb(null, true);
    if (config.corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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
  console.error(err);
  const msg = err.message || 'Server error';
  if (msg.includes('Only image')) {
    return res.status(400).json({ success: false, error: msg });
  }
  res.status(500).json({ success: false, error: 'Server error' });
});

async function boot() {
  try {
    await ensureAdminSeeded();
  } catch (e) {
    console.warn('Admin seed skipped (DB may be offline):', e.message);
  }
  app.listen(config.port, () => {
    console.log(`Parichay Sammelan API 1.0.5 on :${config.port}`);
  });
}

boot();
