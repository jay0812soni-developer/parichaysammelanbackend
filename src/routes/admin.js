import { Router } from 'express';
import { query } from '../db.js';
import { destroyAsset } from '../cloudinary.js';
import { requireAdmin, signAdminToken, verifyAdmin } from '../auth.js';
import { publicEntry } from '../validation.js';

export const adminRouter = Router();

adminRouter.post('/login', async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Missing credentials' });
    }
    const admin = await verifyAdmin(username, password);
    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
    const token = signAdminToken(admin);
    return res.json({ success: true, token, username: admin.username });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

adminRouter.get('/overview', requireAdmin, async (_req, res) => {
  try {
    const [totals] = await query('SELECT COUNT(*)::int AS entries FROM entries');
    const byGender = await query(
      `SELECT gender, COUNT(*)::int AS c FROM entries GROUP BY gender ORDER BY c DESC`
    );
    const byManglik = await query(
      `SELECT manglik, COUNT(*)::int AS c FROM entries GROUP BY manglik ORDER BY c DESC`
    );
    const byMarital = await query(
      `SELECT marital_status, COUNT(*)::int AS c FROM entries
       GROUP BY marital_status ORDER BY c DESC LIMIT 6`
    );
    const recent = await query(
      `SELECT id, name, gender, age, whatsapp, created_at
       FROM entries ORDER BY id DESC LIMIT 8`
    );
    return res.json({
      success: true,
      totals: { entries: totals.entries },
      charts: {
        gender: {
          labels: byGender.map((r) => r.gender || '—'),
          data: byGender.map((r) => r.c),
        },
        manglik: {
          labels: byManglik.map((r) => r.manglik || '—'),
          data: byManglik.map((r) => r.c),
        },
        marital: {
          labels: byMarital.map((r) => r.marital_status || '—'),
          data: byMarital.map((r) => r.c),
        },
      },
      recent: recent.map((r) => publicEntry(r, { fullAadhaar: false })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to load overview' });
  }
});

adminRouter.get('/entries', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const q = String(req.query.q || '').trim().toLowerCase();
    const gender = String(req.query.gender || '').trim();
    const format = String(req.query.format || '').toLowerCase();

    let where = 'WHERE 1=1';
    const params = [];
    if (q) {
      where += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(whatsapp) LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (gender === 'Male' || gender === 'Female') {
      where += ' AND gender = ?';
      params.push(gender);
    }

    if (format === 'csv') {
      const rows = await query(`SELECT * FROM entries ${where} ORDER BY id ASC`, params);
      const headers = [
        'id', 'email', 'name', 'age', 'whatsapp', 'gender', 'height_cm', 'manglik',
        'marital_status', 'study', 'yearly_income', 'aadhaar', 'father_name', 'father_gautra',
        'mother_name', 'mother_father_name', 'mother_gautra', 'mother_parents_address',
        'present_address', 'permanent_address', 'photo_url', 'created_at',
      ];
      const escape = (v) => {
        const s = v == null ? '' : String(v);
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [headers.join(',')];
      for (const row of rows) {
        lines.push(headers.map((h) => escape(row[h])).join(','));
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="parichay-entries.csv"');
      return res.send(lines.join('\n'));
    }

    const countRows = await query(
      `SELECT COUNT(*)::int AS total FROM entries ${where}`,
      params
    );
    const total = countRows[0].total;
    const rows = await query(
      `SELECT * FROM entries ${where} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      data: rows.map((r) => publicEntry(r, { fullAadhaar: false })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to list entries' });
  }
});

adminRouter.get('/entries/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT * FROM entries WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    return res.json({
      success: true,
      data: publicEntry(rows[0], { fullAadhaar: true }),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch entry' });
  }
});

adminRouter.delete('/entries/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query(
      'SELECT cloudinary_public_id FROM entries WHERE id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    await destroyAsset(rows[0].cloudinary_public_id);
    await query('DELETE FROM entries WHERE id = ?', [id]);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to delete entry' });
  }
});

adminRouter.get('/export', requireAdmin, async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM entries ORDER BY id ASC');
    const headers = [
      'id', 'email', 'name', 'age', 'whatsapp', 'gender', 'height_cm', 'manglik',
      'marital_status', 'study', 'yearly_income', 'aadhaar', 'father_name', 'father_gautra',
      'mother_name', 'mother_father_name', 'mother_gautra', 'mother_parents_address',
      'present_address', 'permanent_address', 'photo_url', 'created_at',
    ];
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="entries.csv"');
    return res.send(lines.join('\n'));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Export failed' });
  }
});
