import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function env(name, fallback = '') {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return v;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicApiUrl: env('PUBLIC_API_URL', 'http://localhost:3000'),
  db: {
    host: env('DB_HOST'),
    port: Number(process.env.DB_PORT || 5432),
    user: env('DB_USER', 'root'),
    password: env('DB_PASSWORD'),
    database: env('DB_NAME', 'postgres'),
    ssl: String(process.env.DB_SSL || 'true').toLowerCase() === 'true',
  },
  cloudinary: {
    cloudName: env('CLOUDINARY_CLOUD_NAME'),
    apiKey: env('CLOUDINARY_API_KEY'),
    apiSecret: env('CLOUDINARY_API_SECRET'),
    folder: env('CLOUDINARY_FOLDER', 'parichay-sammelan'),
  },
  admin: {
    username: env('ADMIN_USERNAME', 'SAMMELAN'),
    password: env('ADMIN_PASSWORD', 'ChangeMeStrongPassword!'),
  },
  jwt: {
    secret: env('JWT_SECRET', 'dev-only-change-me'),
    expiresIn: env('JWT_EXPIRES_IN', '7d'),
  },
  corsOrigins: env('CORS_ORIGINS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

/** Returns list of missing production-critical env var names */
export function missingCriticalEnv() {
  const needed = [
    ['DB_HOST', config.db.host],
    ['DB_USER', config.db.user],
    ['DB_PASSWORD', config.db.password],
    ['CLOUDINARY_CLOUD_NAME', config.cloudinary.cloudName],
    ['CLOUDINARY_API_KEY', config.cloudinary.apiKey],
    ['CLOUDINARY_API_SECRET', config.cloudinary.apiSecret],
    ['JWT_SECRET', config.jwt.secret === 'dev-only-change-me' ? '' : config.jwt.secret],
  ];
  return needed.filter(([, v]) => !v).map(([k]) => k);
}
