import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if ((v === undefined || v === '') && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required env: ${name}`);
  }
  return v ?? '';
}

export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicApiUrl: process.env.PUBLIC_API_URL || 'http://localhost:3000',
  db: {
    host: required('DB_HOST', ''),
    port: Number(process.env.DB_PORT || 5432),
    user: required('DB_USER', 'root'),
    password: required('DB_PASSWORD', ''),
    database: required('DB_NAME', 'parichay_sammelan'),
    ssl: String(process.env.DB_SSL || 'true').toLowerCase() === 'true',
  },
  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: required('CLOUDINARY_API_KEY', ''),
    apiSecret: required('CLOUDINARY_API_SECRET', ''),
    folder: process.env.CLOUDINARY_FOLDER || 'parichay-sammelan',
  },
  admin: {
    username: process.env.ADMIN_USERNAME || 'SAMMELAN',
    password: process.env.ADMIN_PASSWORD || 'ChangeMeStrongPassword!',
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-only-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
