import { Router } from 'express';
import { getUploadSignature } from '../cloudinary.js';

export const uploadsRouter = Router();

uploadsRouter.post('/sign', (_req, res) => {
  try {
    const signed = getUploadSignature();
    // Never return api_secret — only cloud name, api_key, timestamp, folder, signature
    return res.json({
      success: true,
      cloud_name: signed.cloud_name,
      api_key: signed.api_key,
      timestamp: signed.timestamp,
      folder: signed.folder,
      signature: signed.signature,
    });
  } catch (e) {
    console.error('sign failed:', e.message);
    return res.status(500).json({ success: false, error: 'Failed to sign upload' });
  }
});
