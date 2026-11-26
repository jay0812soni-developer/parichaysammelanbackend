import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { query } from './db.js';

export async function ensureAdminSeeded() {
  const rows = await query('SELECT id FROM admins WHERE username = ? LIMIT 1', [
    config.admin.username,
  ]);
  if (rows.length) return;
  const hash = await bcrypt.hash(config.admin.password, 12);
  await query('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [
    config.admin.username,
    hash,
  ]);
  console.log(`Seeded admin user: ${config.admin.username}`);
}

export async function verifyAdmin(username, password) {
  const rows = await query(
    'SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
    [username]
  );
  if (!rows.length) return null;
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return null;
  return { id: rows[0].id, username: rows[0].username };
}

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, role: 'admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const payload = jwt.verify(match[1], config.jwt.secret);
    if (payload.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}
