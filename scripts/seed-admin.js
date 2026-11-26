import { ensureAdminSeeded } from '../src/auth.js';
import { pool } from '../src/db.js';

await ensureAdminSeeded();
await pool.end();
console.log('Done.');
