import { Router } from 'express';
import { getUploadSignature } from '../cloudinary.js';

export const uploadsRouter = Router();

uploadsRouter.post('/sign', (_req, res) => {
  try {
    const signed = getUploadSignature();
    return res.json({ success: true, ...signed });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to sign upload' });
  }
});
