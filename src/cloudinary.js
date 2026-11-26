import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

export function getUploadSignature(extra = {}) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: config.cloudinary.folder,
    ...extra,
  };
  const signature = cloudinary.utils.api_sign_request(
    params,
    config.cloudinary.apiSecret
  );
  return {
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    timestamp,
    folder: config.cloudinary.folder,
    signature,
    ...extra,
  };
}

export async function uploadBuffer(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: config.cloudinary.folder,
        public_id: filename ? filename.replace(/\.[^.]+$/, '') : undefined,
        resource_type: 'image',
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function destroyAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn('Cloudinary destroy failed:', e.message);
  }
}

export { cloudinary };
