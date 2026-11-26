/**
 * Migrates cleaned rows from if0_39177314_sammelan.sql into TiDB (PostgreSQL).
 * Usage: node scripts/migrate-from-dump.js [path-to-sql]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../src/db.js';
import { normalizeHeight, parseEntriesDump, unescapeHtml } from './parse-dump.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpPath =
  process.argv[2] ||
  path.join(__dirname, '..', '..', 'if0_39177314_sammelan.sql');

const sql = fs.readFileSync(dumpPath, 'utf8');
const rows = parseEntriesDump(sql);
console.log(`Parsed ${rows.length} rows from dump`);

let inserted = 0;
for (const f of rows) {
  const [
    id,
    email,
    photo,
    name,
    age,
    whatsapp,
    gender,
    height_cm,
    manglik,
    marital_status,
    study,
    yearly_income,
    aadhaar,
    father_name,
    father_gautra,
    mother_name,
    mother_father_name,
    mother_gautra,
    mother_parents_address,
    present_address,
    permanent_address,
  ] = f;

  const photoUrl = String(photo || '').startsWith('http')
    ? photo
    : photo
      ? `legacy://${photo}`
      : 'legacy://missing';

  try {
    await query(
      `INSERT INTO entries
      (id, email, photo_url, cloudinary_public_id, name, age, whatsapp, gender, height_cm, manglik,
       marital_status, study, yearly_income, aadhaar, father_name, father_gautra, mother_name,
       mother_father_name, mother_gautra, mother_parents_address, present_address, permanent_address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT (id) DO UPDATE SET
         email=EXCLUDED.email,
         name=EXCLUDED.name,
         height_cm=EXCLUDED.height_cm,
         present_address=EXCLUDED.present_address,
         permanent_address=EXCLUDED.permanent_address`,
      [
        id,
        unescapeHtml(email),
        photoUrl,
        null,
        unescapeHtml(name),
        Number(age),
        unescapeHtml(whatsapp),
        gender,
        normalizeHeight(height_cm),
        manglik,
        unescapeHtml(marital_status),
        unescapeHtml(study),
        Number(yearly_income),
        String(aadhaar).replace(/\D/g, '').slice(0, 12),
        unescapeHtml(father_name),
        unescapeHtml(father_gautra),
        unescapeHtml(mother_name),
        unescapeHtml(mother_father_name),
        unescapeHtml(mother_gautra),
        unescapeHtml(mother_parents_address),
        unescapeHtml(present_address),
        unescapeHtml(permanent_address),
      ]
    );
    inserted++;
  } catch (e) {
    console.error(`Row id=${id} failed:`, e.message);
  }
}

// Keep SERIAL in sync with imported ids
try {
  await query(
    `SELECT setval(pg_get_serial_sequence('entries', 'id'), COALESCE((SELECT MAX(id) FROM entries), 1))`
  );
} catch (e) {
  console.warn('setval skipped:', e.message);
}

console.log(`Inserted/updated ${inserted} rows`);
await pool.end();
