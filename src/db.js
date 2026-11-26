import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
});

/** Convert MySQL-style `?` placeholders to PostgreSQL `$1, $2, ...` */
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function query(sql, params = []) {
  const result = await pool.query(toPg(sql), params);
  return result.rows;
}

export async function queryResult(sql, params = []) {
  return pool.query(toPg(sql), params);
}
