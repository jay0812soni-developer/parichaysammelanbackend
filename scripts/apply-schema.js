import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const client = await pool.connect();
try {
  console.log('Connected to', process.env.DB_HOST || '(from config)');
  await client.query(schema);
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log(
    'Tables:',
    tables.rows.map((r) => r.tablename).join(', ')
  );
  console.log('Schema OK');
} finally {
  client.release();
  await pool.end();
}
