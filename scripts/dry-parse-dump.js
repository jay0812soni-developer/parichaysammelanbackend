import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeHeight, parseEntriesDump, unescapeHtml } from './parse-dump.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dumpPath =
  process.argv[2] ||
  path.join(__dirname, '..', '..', 'if0_39177314_sammelan.sql');

const sql = fs.readFileSync(dumpPath, 'utf8');
const rows = parseEntriesDump(sql);
console.log(`Parsed ${rows.length} rows`);
const shortHeights = rows.filter((r) => Number(r[7]) < 100).length;
console.log(`Rows with height<100 (will convert inches→cm): ${shortHeights}`);
const sample = rows[0];
console.log(
  'Sample:',
  sample[0],
  unescapeHtml(sample[3]),
  'height',
  sample[7],
  '→',
  normalizeHeight(sample[7])
);
console.log('OK');
